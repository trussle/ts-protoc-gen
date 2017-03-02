import {
  filePathToPseudoNamespace,
  snakeToCamel,
  uppercaseFirst,
  filePathFromProtoWithoutExtension
} from "./util";
import {ExportMap} from "./ExportMap";
import {TypeNumToExport, MESSAGE_TYPE, ENUM_TYPE, BYTES_TYPE} from "./FieldTypes";
import {Printer} from "./Printer";
import {
  EnumDescriptorProto, FieldDescriptorProto,
  FileDescriptorProto, OneofDescriptorProto, DescriptorProto
} from "google-protobuf/google/protobuf/descriptor_pb";

function outputEnum(enumDescriptor: EnumDescriptorProto, indentLevel: number) {
  const printer = new Printer(indentLevel);
  printer.printLn(`export enum ${enumDescriptor.getName()} {`);
  enumDescriptor.getValueList().forEach(value => {
    printer.printIndentedLn(`${value.getName()} = ${value.getNumber()},`);
  });
  printer.printLn(`}`);
  return printer.getOutput();
}

function oneOfName(name: string) {
  return uppercaseFirst(snakeToCamel(name));
}

const builtInProtoToFile: {[key: string]: string} = {
  "google/protobuf/compiler/plugin.proto": "google-protobuf/google/protobuf/compiler/plugin_pb",
  "google/protobuf/any.proto": "google-protobuf/google/protobuf/any_pb",
  "google/protobuf/api.proto": "google-protobuf/google/protobuf/api_pb",
  "google/protobuf/descriptor.proto": "google-protobuf/google/protobuf/descriptor_pb",
  "google/protobuf/duration.proto": "google-protobuf/google/protobuf/duration_pb",
  "google/protobuf/empty.proto": "google-protobuf/google/protobuf/empty_pb",
  "google/protobuf/field_mask.proto": "google-protobuf/google/protobuf/field_mask_pb",
  "google/protobuf/source_context.proto": "google-protobuf/google/protobuf/source_context_pb",
  "google/protobuf/struct.proto": "google-protobuf/google/protobuf/struct_pb",
  "google/protobuf/timestamp.proto": "google-protobuf/google/protobuf/timestamp_pb",
  "google/protobuf/type.proto": "google-protobuf/google/protobuf/type_pb",
  "google/protobuf/wrappers.proto": "google-protobuf/google/protobuf/wrappers_pb"
};

function getType(type: FieldDescriptorProto.Type, typeName: string, currentFileName: string, exportMap: ExportMap): string {
  if (type === MESSAGE_TYPE) {
    const fromExport = exportMap.getMessage(typeName);
    if (!fromExport) {
      throw new Error("Could not getType for message: " + typeName);
    }
    const withinNamespace = typeName.substring(fromExport.pkg.length + 1);
    if (fromExport.fileName === currentFileName) {
      return withinNamespace;
    } else {
      return filePathToPseudoNamespace(fromExport.fileName) + "." + withinNamespace;
    }
  } else if (type === ENUM_TYPE) {
    const fromExport = exportMap.getEnum(typeName);
    if (!fromExport) {
      throw new Error("Could not getType for enum: " + typeName);
    }
    const withinNamespace = typeName.substring(fromExport.pkg.length + 1);
    if (fromExport.fileName === currentFileName) {
      return withinNamespace;
    } else {
      return filePathToPseudoNamespace(fromExport.fileName) + "." + withinNamespace;
    }
  } else {
    return TypeNumToExport[type];
  }
}

function hasFieldPresence(field: FieldDescriptorProto, fileDescriptor: FileDescriptorProto): boolean {
  if (field.getLabel() == FieldDescriptorProto.Label.LABEL_REPEATED) {
    return false;
  }

  if (field.hasOneofIndex()) {
    return true;
  }

  if (field.getType() === MESSAGE_TYPE) {
    return true;
  }

  if (fileDescriptor.getSyntax() === "" || fileDescriptor.getSyntax() === "proto2") {
    // Empty syntax defaults to proto2
    return true;
  }

  return false;
}

function outputOneOfDecl(oneOfDecl: OneofDescriptorProto, oneOfFields: Array<FieldDescriptorProto>, indentLevel: number) {
  const printer = new Printer(indentLevel);

  printer.printLn(`export enum ${oneOfName(oneOfDecl.getName())}Case {`);
  printer.printIndentedLn(`${oneOfDecl.getName().toUpperCase()}_NOT_SET = 0,`);
  oneOfFields.forEach(field => {
    printer.printIndentedLn(`${field.getName().toUpperCase()} = ${field.getNumber()},`);
  });
  printer.printLn('}');

  return printer.output;
}

function outputMessage(fileName: string, exportMap: ExportMap, messageDescriptor: DescriptorProto, indentLevel: number, fileDescriptor: FileDescriptorProto) {
  const messageName = messageDescriptor.getName();
  const messageOptions = messageDescriptor.getOptions();
  if (messageOptions !== undefined && messageOptions.getMapEntry()) {
    // this message type is the entry tuple for a map - don't output it
    return "";
  }

  const objectTypeName = `AsObject`;
  const toObjectType = new Printer(indentLevel + 1);
  toObjectType.printLn(`export type ${objectTypeName} = {`);

  const printer = new Printer(indentLevel);
  printer.printLn(`export class ${messageName} extends jspb.Message {`);

  const oneOfGroups: Array<Array<FieldDescriptorProto>> = [];

  messageDescriptor.getFieldList().forEach(field => {
    if (field.hasOneofIndex()) {
      const oneOfIndex = field.getOneofIndex();
      let existing = oneOfGroups[oneOfIndex];
      if (existing === undefined){
        existing = [];
        oneOfGroups[oneOfIndex] = existing;
      }
      existing.push(field);
    }
    const snakeCaseName = field.getName();
    const camelCaseName = snakeToCamel(snakeCaseName);
    const withUppercase = uppercaseFirst(camelCaseName);
    const type = field.getType();

    let exportType;
    const fullTypeName = field.getTypeName().slice(1);
    if (type === MESSAGE_TYPE) {
      const fieldMessageType = exportMap.getMessage(fullTypeName);
      if (fieldMessageType === undefined) {
        throw new Error("No message export for: " + fullTypeName);
      }
      if (fieldMessageType.messageOptions !== undefined && fieldMessageType.messageOptions.getMapEntry()) {
        // This field is a map
        const keyTuple = fieldMessageType.mapFieldOptions!.key;
        const keyType = keyTuple[0];
        const keyTypeName = getType(keyType, keyTuple[1], fileName, exportMap);
        const valueTuple = fieldMessageType.mapFieldOptions!.value;
        const valueType = valueTuple[0];
        let valueTypeName = getType(valueType, valueTuple[1], fileName, exportMap);
        if (valueType === BYTES_TYPE) {
          valueTypeName = "Uint8Array | string";
        }
        printer.printIndentedLn(`get${withUppercase}Map(): jspb.Map<${keyTypeName}, ${valueTypeName}>;`);
        printer.printIndentedLn(`clear${withUppercase}Map(): void;`);
        toObjectType.printIndentedLn(`${camelCaseName}Map: Array<[${keyTypeName}${keyType === MESSAGE_TYPE ? '.AsObject' : ''}, ${valueTypeName}${valueType === MESSAGE_TYPE ? '.AsObject' : ''}]>,`);
        return;
      }
      const withinNamespace = fullTypeName.substring(fieldMessageType.pkg.length + 1);
      if (fieldMessageType.fileName === fileName) {
        exportType = withinNamespace;
      } else {
        exportType = filePathToPseudoNamespace(fieldMessageType.fileName) + "." + withinNamespace;
      }
    } else if (type === ENUM_TYPE) {
      const fieldEnumType = exportMap.getEnum(fullTypeName);
      if (fieldEnumType === undefined) {
        throw new Error("No enum export for: " + fullTypeName);
      }
      const withinNamespace = fullTypeName.substring(fieldEnumType.pkg.length + 1);
      if (fieldEnumType.fileName === fileName) {
        exportType = withinNamespace;
      } else {
        exportType = filePathToPseudoNamespace(fieldEnumType.fileName) + "." + withinNamespace;
      }
    } else {
      exportType = TypeNumToExport[type];
    }

    let hasClearMethod = false;
    function printClearIfNotPresent() {
      if (!hasClearMethod) {
        hasClearMethod = true;
        printer.printIndentedLn(`clear${withUppercase}${field.getLabel() == FieldDescriptorProto.Label.LABEL_REPEATED ? 'List' : ''}(): void;`);
      }
    }

    if (hasFieldPresence(field, fileDescriptor)){
      printer.printIndentedLn(`has${withUppercase}(): boolean;`);
      printClearIfNotPresent();
    }


    function printRepeatedAddMethod(valueType: string) {
      const optionalValue = field.getType() === MESSAGE_TYPE;
      printer.printIndentedLn(`add${withUppercase}(value${optionalValue ? '?' : ''}: ${valueType}, index?: number): void;`);
    }

    if (field.getLabel() == FieldDescriptorProto.Label.LABEL_REPEATED){// is repeated
      printClearIfNotPresent();
      if (type === BYTES_TYPE) {
        toObjectType.printIndentedLn(`${camelCaseName}List: Array<Uint8Array | string>,`);
        printer.printIndentedLn(`get${withUppercase}List(): Array<Uint8Array | string>;`);
        printer.printIndentedLn(`get${withUppercase}List_asU8(): Array<Uint8Array>;`);
        printer.printIndentedLn(`get${withUppercase}List_asB64(): Array<string>;`);
        printer.printIndentedLn(`set${withUppercase}List(value: Array<Uint8Array | string>): void;`);
        printRepeatedAddMethod('Uint8Array | string');
      } else {
        toObjectType.printIndentedLn(`${camelCaseName}List: Array<${exportType}${type === MESSAGE_TYPE ? '.AsObject' : ''}>,`);
        printer.printIndentedLn(`get${withUppercase}List(): Array<${exportType}>;`);
        printer.printIndentedLn(`set${withUppercase}List(value: Array<${exportType}>): void;`);
        printRepeatedAddMethod(exportType);
      }
    } else {
      if (type === BYTES_TYPE) {
        toObjectType.printIndentedLn(`${camelCaseName}: Uint8Array | string,`);
        printer.printIndentedLn(`get${withUppercase}(): Uint8Array | string;`);
        printer.printIndentedLn(`get${withUppercase}_asU8(): Uint8Array;`);
        printer.printIndentedLn(`get${withUppercase}_asB64(): string;`);
        printer.printIndentedLn(`set${withUppercase}(value: Uint8Array | string): void;`);
      } else {
        toObjectType.printIndentedLn(`${camelCaseName}: ${exportType}${type === MESSAGE_TYPE ? '.AsObject' : ''},`);        
        printer.printIndentedLn(`get${withUppercase}(): ${exportType};`);
        printer.printIndentedLn(`set${withUppercase}(value: ${exportType}): void;`);
      }
    }
    printer.printEmptyLn();
  });

  toObjectType.printLn(`};`);  

  messageDescriptor.getOneofDeclList().forEach(oneOfDecl => {
    printer.printIndentedLn(`get${oneOfName(oneOfDecl.getName())}Case(): ${messageName}.${oneOfName(oneOfDecl.getName())}Case;`);
  });

  printer.printIndentedLn(`serializeBinary(): Uint8Array;`);
  printer.printIndentedLn(`toObject(includeInstance?: boolean): ${messageName}.${objectTypeName};`);
  printer.printIndentedLn(`static toObject(includeInstance: boolean, msg: ${messageName}): ${messageName}.${objectTypeName};`);
  printer.printIndentedLn(`static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };`);
  printer.printIndentedLn(`static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };`);
  printer.printIndentedLn(`static serializeBinaryToWriter(message: ${messageName}, writer: jspb.BinaryWriter): void;`);
  printer.printIndentedLn(`static deserializeBinary(bytes: Uint8Array): ${messageName};`);
  printer.printIndentedLn(`static deserializeBinaryFromReader(message: ${messageName}, reader: jspb.BinaryReader): ${messageName};`);

  printer.printLn(`}`);
  printer.printEmptyLn();

  printer.printLn(`export namespace ${messageName} {`);

  printer.print(toObjectType.getOutput());
  printer.printEmptyLn();  

  messageDescriptor.getNestedTypeList().forEach(nested => {
    const msgOutput = outputMessage(fileName, exportMap, nested, indentLevel + 1, fileDescriptor);
    if (msgOutput != "") {
      // If the message class is a Map entry then it isn't output, so don't print the namespace block
      printer.print(msgOutput);
    }
  });
  messageDescriptor.getEnumTypeList().forEach(enumType => {
    printer.print(`${outputEnum(enumType, indentLevel + 1)}`);
  });
  messageDescriptor.getOneofDeclList().forEach((oneOfDecl, index) => {
    printer.print(`${outputOneOfDecl(oneOfDecl, oneOfGroups[index] || [], indentLevel + 1)}`);
  });
  messageDescriptor.getExtensionList().forEach(extension => {
    printer.printIndentedLn(`const ${snakeToCamel(extension.getName())}: jspb.ExtensionFieldInfo<${getType(extension.getType(), extension.getTypeName().slice(1), fileName, exportMap)}>`);
  });

  printer.printLn(`}`);
  printer.printEmptyLn();

  return printer.getOutput();
}

export function processFileDescriptor(fileDescriptor: FileDescriptorProto, exportMap: ExportMap) {
  const fileName = fileDescriptor.getName();

  const packageName = fileDescriptor.getPackage();

  const printer = new Printer(0);

  printer.printLn(`// package: ${packageName}`);
  printer.printLn(`// file: ${fileDescriptor.getName()}`);

  const depth = fileName.split("/").length;
  const upToRoot = new Array(depth).join("../");

  printer.printEmptyLn();
  printer.printLn(`import * as jspb from "google-protobuf";`);

  fileDescriptor.getDependencyList().forEach((dependency: string) => {
    const pseudoNamespace = filePathToPseudoNamespace(dependency);
    if (dependency in builtInProtoToFile) {
      printer.printLn(`import * as ${pseudoNamespace} from "${builtInProtoToFile[dependency]}";`);
    } else {
      const filePath = filePathFromProtoWithoutExtension(dependency);
      printer.printLn(`import * as ${pseudoNamespace} from "${upToRoot + filePath}";`);
    }
  });

  printer.printEmptyLn();

  fileDescriptor.getMessageTypeList().forEach(enumType => {
    printer.print(outputMessage(fileName, exportMap, enumType, 0, fileDescriptor));
  });

  fileDescriptor.getExtensionList().forEach(extension => {
    printer.printLn(`export const ${snakeToCamel(extension.getName())}: jspb.ExtensionFieldInfo<${getType(extension.getType(), extension.getTypeName().slice(1), fileName, exportMap)}>;`);
  });

  fileDescriptor.getEnumTypeList().forEach(enumType => {
    printer.print(outputEnum(enumType, 0));
  });

  return printer.getOutput();
}
