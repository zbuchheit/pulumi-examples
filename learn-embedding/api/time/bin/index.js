"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.location = exports.timezone = exports.handler = void 0;
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Received event:', JSON.stringify(event, null, 2));
    let message;
    switch (event.request) {
        case "timezone":
            message = timezone();
            break;
        case "location":
            message = location() || "Location not found";
            break;
        default:
            message = "Unknown request";
    }
    return {
        statusCode: 200,
        body: JSON.stringify({ message }),
    };
});
exports.handler = handler;
function timezone() {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}
exports.timezone = timezone;
function location() {
    return process.env.AWS_REGION;
}
exports.location = location;
