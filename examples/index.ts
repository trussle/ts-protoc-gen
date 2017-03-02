import {OuterMessage, SomeEnum, SomeRequest} from "./_out/examplecom/services/complextypes/complextypes_pb";
import { CommonName, NamesEnum, CommonId } from "./_out/examplecom/common/names_pb";
import {Any} from "google-protobuf/google/protobuf/any_pb";
import {Empty} from "google-protobuf/google/protobuf/empty_pb";
import {Timestamp} from "google-protobuf/google/protobuf/timestamp_pb";
import * as jspb from 'google-protobuf';

import "./MessageTest";

const myOuterMessage = new OuterMessage();
myOuterMessage.setSomeString("this_is_some_string");
const myCommonName = new CommonName();
myCommonName.setName("my_common_name");
myCommonName.getMyEnumMap();
const commonId1 = new CommonId();
commonId1.setId(123);
const commonId2 = new CommonId();
commonId2.setId(456);
myCommonName.setMultiIdList([commonId1, commonId2]);
const timestamp1 = new Timestamp();
timestamp1.setSeconds(1000000);
const timestamp2 = new Timestamp();
timestamp2.setSeconds(2000000);
myCommonName.setMultiTimestampList([timestamp1, timestamp2]);
const msgMap = myCommonName.getMyMsgMap();
msgMap.set("c1", commonId1);
msgMap.set("c2", commonId2);
const enumMap = myCommonName.getMyEnumMap();
enumMap.set("e1", NamesEnum.FIRST_NAME);
enumMap.set("e2", NamesEnum.SECOND_NAME);

myOuterMessage.setSomeCommonName(myCommonName);
myOuterMessage.setSomeEnum(SomeEnum.VALUE2);
myOuterMessage.setSomeNamesEnum(NamesEnum.SECOND_NAME);

const asObject = myCommonName.toObject();
console.log("myCommonName",JSON.stringify(asObject, null, 2));

console.log("myCommonName.name", asObject.name);
console.log("myCommonName.multiTimestampList.seconds", asObject.multiTimestampList[0].seconds);
console.log("myCommonName.myEnumMap01", asObject.myEnumMap[0][1]);
console.log("myCommonName.multiIdList0.id", asObject.multiIdList[0].id);
console.log("myCommonName.myMsgMap01.id", asObject.myMsgMap[0][1].id);

const myInnerName = new CommonName.InnerName();
myInnerName.setInnerNameProp("my_inner_name_prop");

const myTimestamp = new Timestamp();
myTimestamp.setSeconds(1000);
const innerAny = new Any();
// innerAny.pack(myTimestamp.serializeBinary(), "google.google.protobuf.Timestamp");
myInnerName.setInnerAnyProp(innerAny);
myOuterMessage.setSomeInnerName(myInnerName);

const myInnerMessage = new OuterMessage.InnerMessage();
myInnerMessage.setSomeInt(123);

if (true) {
  const innerMap = myInnerMessage.getInnerToInnerNameMap();
  const entryOne = new CommonName.InnerName();
  entryOne.setInnerNameProp("entry-one-name");
  innerMap.set(123, entryOne);
  const entryTwo = new CommonName.InnerName();
  entryTwo.setInnerNameProp("entry-two-name");
  innerMap.set(456, entryTwo);
  innerMap.forEach((entry, key) => {
    console.log("existing.entry: ", entry.getInnerNameProp(), "key: ", key, typeof key);
  });
  const keysIterator = innerMap.keys();
  let keyNext = keysIterator.next();
  while (!keyNext.done) {
    console.log("existing.keysIterator key: ", keyNext.value, typeof keyNext.value);
    keyNext = keysIterator.next();
  }

  const entryIterator = innerMap.entries();
  let next = entryIterator.next();
  while (!next.done) {
    console.log("existing.entryIterator entry: ", next.value, typeof next.value, next.value[1].getInnerNameProp());
    next = entryIterator.next();
  }
}

if (true) {
  const someRequest = new SomeRequest();
  const anEmpty = new Empty();
  someRequest.addSomeEmpty(anEmpty);
  const anEmpty2 = new Empty();
  someRequest.addSomeEmpty(anEmpty2);
  console.log("someRequest.getSomeEmptyList().length",someRequest.getSomeEmptyList().length);
}

if (true) {
  const someRequest = new SomeRequest();
  someRequest.addSomeBytes(new Uint8Array(50));
  someRequest.addSomeBytes(new Uint8Array(123));
  console.log("someRequest.getSomeBytesList().length",someRequest.getSomeBytesList().length);
}

if (true) {
  const someRequest = new SomeRequest();
  const aTimestamp = new Timestamp();
  aTimestamp.setSeconds(1489156085);
  aTimestamp.setNanos(123);
  someRequest.addSomeTimestamp(aTimestamp);
  const aTimestamp2 = new Timestamp();
  someRequest.addSomeTimestamp(aTimestamp2);
  console.log("someRequest.getSomeTimestampList().length",someRequest.getSomeTimestampList()[0].toDate());
}

if (true) {
  const entryOne = new CommonName.InnerName();
  entryOne.setInnerNameProp("entry-one-name");
  const entryTwo = new CommonName.InnerName();
  entryTwo.setInnerNameProp("entry-two-name");
  const innerMap = new jspb.Map([
    [123, entryOne],
    [456, entryTwo],
  ], CommonName.InnerName);
  innerMap.forEach((entry, key) => {
    console.log("constructed.entry: ", entry.getInnerNameProp(), "key: ", key, typeof key);
  });
  const keysIterator = innerMap.keys();
  let keyNext = keysIterator.next();
  while (!keyNext.done) {
    console.log("constructed.keysIterator key: ", keyNext.value, typeof keyNext.value);
    keyNext = keysIterator.next();
  }

  const entryIterator = innerMap.entries();
  let next = entryIterator.next();
  while (!next.done) {
    console.log("constructed.entryIterator entry: ", next.value, typeof next.value, next.value[1].getInnerNameProp());
    next = entryIterator.next();
  }

  console.log("constructed.toArray", innerMap.toArray());
}

const myDeepMessage = new OuterMessage.InnerMessage.DeepMessage();
myDeepMessage.setSomeDeepInt(456);
myInnerMessage.setSomeDeepMessage(myDeepMessage);
myOuterMessage.setSomeInnerMessage(myInnerMessage);

console.log("myOuterMessage.someCommonName.getName()",myOuterMessage.getSomeCommonName().getName());

console.log("myOuterMessage.toArray()",myOuterMessage.toArray());

const serialized = myOuterMessage.serializeBinary();
console.log("myOuterMessage", myOuterMessage.toObject());

const asDeserialized = OuterMessage.deserializeBinary(serialized);
console.log("asDeserialized", asDeserialized.toObject());

console.log("asDeserialized.hasSomeCommonName()",asDeserialized.hasSomeCommonName());

console.log("asDeserialized.getSomeEnum()",asDeserialized.getSomeEnum());
console.log("asDeserialized.getSomeNamesEnum()",asDeserialized.getSomeNamesEnum());

