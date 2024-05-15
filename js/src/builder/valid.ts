// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import { DataType } from '../type.js';
import { valueToString } from '../util/pretty.js';

/**
 * Dynamically compile the null values into an `isValid()` function whose
 * implementation is a switch statement. Microbenchmarks in v8 indicate
 * this approach is 25% faster than using an ES6 Map.
 *
 * @example
 * console.log(createIsValidFunction([null, 'N/A', NaN]));
 * `function (x) {
 *     if (x !== x) return false;
 *     switch (x) {
 *         case null:
 *         case "N/A":
 *             return false;
 *     }
 *     return true;
 * }`
 *
 * @ignore
 * @param nullValues
 */
export function createIsValidFunction<T extends DataType = any, TNull = any>(nullValues?: ReadonlyArray<TNull>) {

    if (!nullValues || nullValues.length <= 0) {
        // @ts-ignore
        return function isValid(value: any) { return true; };
    }

    let fnBody = '';
    const noNaNs = nullValues.filter((x) => x === x);
    const [a, b, c, d, e, f] = noNaNs;
    if (nullValues.length !== noNaNs.length) {
        switch (nullValues.length) {
            case 0: return function isValid(x: any) { return x === x; };
            case 1: return function isValid(x: any) { return x === x && x !== a; };
            case 2: return function isValid(x: any) { return x === x && x !== a && x !== b; };
            case 3: return function isValid(x: any) { return x === x && x !== a && x !== b && x !== c; };
            case 4: return function isValid(x: any) { return x === x && x !== a && x !== b && x !== c && x !== d; };
            case 5: return function isValid(x: any) { return x === x && x !== a && x !== b && x !== c && x !== d && x !== e; };
            case 6: return function isValid(x: any) { return x === x && x !== a && x !== b && x !== c && x !== d && x !== e && x !== f; };
        }
    } else {
        switch (nullValues.length) {
            case 1: return function isValid(x: any) { return x !== a; };
            case 2: return function isValid(x: any) { return x !== a && x !== b; };
            case 3: return function isValid(x: any) { return x !== a && x !== b && x !== c; };
            case 4: return function isValid(x: any) { return x !== a && x !== b && x !== c && x !== d; };
            case 5: return function isValid(x: any) { return x !== a && x !== b && x !== c && x !== d && x !== e; };
            case 6: return function isValid(x: any) { return x !== a && x !== b && x !== c && x !== d && x !== e && x !== f; };
        }
    }
    if (!nullValues) {
        throw new Error(`Unsupported nulls: ${JSON.stringify(nullValues)}`);
    }
    // const noNaNs = nullValues.filter((x) => x === x);

    if (noNaNs.length > 0) {
        fnBody = `
    switch (x) {${noNaNs.map((x) => `
        case ${valueToCase(x)}:`).join('')}
            return false;
    }`;
    }

    // NaN doesn't equal anything including itself, so it doesn't work as a
    // switch case. Instead we must explicitly check for NaN before the switch.
    if (nullValues.length !== noNaNs.length) {
        fnBody = `if (x !== x) return false;\n${fnBody}`;
    }

    return new Function(`x`, `${fnBody}\nreturn true;`) as (value: T['TValue'] | TNull) => boolean;
}

/** @ignore */
function valueToCase(x: any) {
    if (typeof x !== 'bigint') {
        return valueToString(x);
    }
    return `${valueToString(x)}n`;
}
