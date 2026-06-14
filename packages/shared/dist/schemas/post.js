"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePostSchema = void 0;
const zod_1 = require("zod");
exports.CreatePostSchema = zod_1.z.object({
    caption: zod_1.z.string().max(500).optional(),
    mediaType: zod_1.z.enum(['IMAGE', 'VIDEO']),
});
