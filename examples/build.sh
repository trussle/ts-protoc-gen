#!/bin/bash

rm -r _out/
mkdir -p _out/

PATH=../bin:$PATH protoc \
   --js_out=import_style=commonjs,binary:_out \
   --ts_out=_out \
   -I . \
   examplecom/*.proto \
   examplecom/common/*.proto \
   examplecom/services/complextypes/*.proto \
   examplecom/services/ping/*.proto


PATH=../bin:$PATH protoc \
   --js_out=import_style=commonjs,binary:_out \
   --ts_out=_out \
   -I . \
   google/protobuf/*.proto \
   google/protobuf/*/*.proto
