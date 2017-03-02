export const TypeNumToExport: {[key: number]: string} = {};

// 0 is reserved for errors.
TypeNumToExport[1] = "number";//TYPE_DOUBLE
TypeNumToExport[2] = "number";//TYPE_FLOAT
TypeNumToExport[3] = "number";//TYPE_INT64
TypeNumToExport[4] = "number";//TYPE_UINT64
TypeNumToExport[5] = "number";//TYPE_INT32
TypeNumToExport[6] = "number";//TYPE_FIXED64
TypeNumToExport[7] = "number";//TYPE_FIXED32
TypeNumToExport[8] = "boolean";//TYPE_BOOL
TypeNumToExport[9] = "string";//TYPE_STRING
TypeNumToExport[10] = "Object";//TYPE_GROUP
export const MESSAGE_TYPE = 11;
TypeNumToExport[MESSAGE_TYPE] = "Object";//TYPE_MESSAGE - Length-delimited aggregate.

export const BYTES_TYPE = 12;
TypeNumToExport[BYTES_TYPE] = "Uint8Array";//TYPE_BYTES
TypeNumToExport[13] = "number";//TYPE_UINT32

export const ENUM_TYPE = 14;
TypeNumToExport[ENUM_TYPE] = "number";//TYPE_ENUM
TypeNumToExport[15] = "number";//TYPE_SFIXED32
TypeNumToExport[16] = "number";//TYPE_SFIXED64
TypeNumToExport[17] = "number";//TYPE_SINT32 - Uses ZigZag encoding.
TypeNumToExport[18] = "number";//TYPE_SINT64 - Uses ZigZag encoding.