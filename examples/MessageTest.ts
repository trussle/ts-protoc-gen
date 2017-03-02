import {
  OuterMessage, SomeEnum, SomeComplex,
  someExtSimp
} from "./_out/examplecom/services/complextypes/complextypes_pb";
import {CommonName, NamesEnum} from "./_out/examplecom/common/names_pb";

import * as jspb from 'google-protobuf';
import SimpleString = SomeComplex.SimpleString;
import {MySimple} from "./_out/examplecom/simple_pb";
import {Any} from "google-protobuf/google/protobuf/any_pb";

do {
  const outerOne = new OuterMessage();
  outerOne.setSomeString("this_is_some_string");
  const innerOne = new CommonName();
  innerOne.setName("my_common_name");
  outerOne.setSomeCommonName(innerOne);
  outerOne.setSomeEnum(SomeEnum.VALUE2);
  outerOne.setSomeNamesEnum(NamesEnum.SECOND_NAME);

  const outerTwo = new OuterMessage();
  outerTwo.setSomeString("this_is_some_string");
  const innerTwo = new CommonName();
  innerTwo.setName("my_common_name");
  outerTwo.setSomeCommonName(innerTwo);
  outerTwo.setSomeEnum(SomeEnum.VALUE2);
  outerTwo.setSomeNamesEnum(NamesEnum.SECOND_NAME);

  console.log("are equal: " + jspb.Message.equals(outerOne, outerTwo));
} while (false);

do {
  const outerOne = new OuterMessage();
  outerOne.setSomeString("this_is_some_string");
  const innerOne = new CommonName();
  innerOne.setName("my_common_name");
  outerOne.setSomeCommonName(innerOne);
  outerOne.setSomeEnum(SomeEnum.VALUE2);
  outerOne.setSomeNamesEnum(NamesEnum.SECOND_NAME);

  const outerTwo = new OuterMessage();
  jspb.Message.initialize(outerTwo, outerOne.toArray(), 0, -1, null, null);

  console.log("are equal: " + jspb.Message.equals(outerOne, outerTwo));
} while (false);

do {
  const someComplex = new SomeComplex();
  const simp1 = new SimpleString();
  simp1.setSimple("simple-1");
  someComplex.addSomeResponses(simp1);
  const simp2 = new SimpleString();
  simp2.setSimple("simple-2");
  someComplex.addSomeResponses(simp2);
  const asObjectList = jspb.Message.toObjectList(someComplex.getSomeResponsesList(), SimpleString.toObject, false);
  console.log("SomeComplex.asObject", asObjectList);

  const extInfo = new jspb.ExtensionFieldInfo(
    105,
    {someExtSimp: 0},
    SomeComplex.SimpleString,
    SomeComplex.SimpleString.toObject,
    0);

  const someSimpleString = new SomeComplex.SimpleString();
  someSimpleString.setSimple("this-is-an-extension-string");
  someComplex.setExtension(someExtSimp, someSimpleString);

  const someAnotherString = new SomeComplex.AnotherString();
  someAnotherString.setAnother("this-is-another-extension-string");
  someComplex.setExtension(SomeComplex.someExtAnother, someAnotherString);

  const toObjHolder = {someKey: 567};
  jspb.Message.toObjectExtension(someComplex, toObjHolder, SomeComplex.extensions, SomeComplex.prototype.getExtension, false);
  console.log("toObjHolder", toObjHolder);

  console.log("someComplex.toObject", someComplex.toObject());

  const serialized = someComplex.serializeBinary();

  // Do the extensions survive serialization? (i.e. were they applied properly?)
  const deserialized = SomeComplex.deserializeBinary(serialized);
  console.log("deserialized.someComplex.toObject", deserialized.toObject());

} while(false);

do {
  const simp1 = new SimpleString();
  simp1.setSimple("simple-1");


  const someSimple = new MySimple();
  const someAny = new Any();
  someAny.pack(simp1.serializeBinary(), "examplecom.services.complextypes.SimpleString");
  someSimple.setSomeAny(someAny);

  const serialized = someSimple.serializeBinary();

  const deserialized = MySimple.deserializeBinary(serialized);
  const desAny = deserialized.getSomeAny();
  const reSimple = desAny.unpack(SimpleString.deserializeBinary, "examplecom.services.complextypes.SimpleString");

  console.log("Any unpacked string: " + reSimple.getSimple());
} while (false);