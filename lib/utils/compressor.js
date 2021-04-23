"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var archiver_1 = __importDefault(require("archiver"));
var chalk_1 = __importDefault(require("chalk"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var Compressor = /** @class */ (function () {
    function Compressor(log) {
        if (log === void 0) { log = false; }
        this.logging = log;
    }
    Compressor.prototype.compress = function (from, to, compress) {
        var _this = this;
        var output = fs_extra_1.default.createWriteStream(path_1.default.resolve(to));
        var arch = archiver_1.default('zip', {
            zlib: { level: compress } // Sets the compression level.
        });
        arch.pipe(output);
        arch.append(fs_extra_1.default.createReadStream(from), { name: path_1.default.parse(from).base });
        return new Promise(function (resolve, reject) {
            // handle success
            output.on('warning', function (err) {
                if (err.code !== 'ENOENT') {
                    throw new Error(err);
                }
            });
            output.on("error", reject);
            output.on('close', function () {
                _this.log(arch.pointer() + ' total bytes', chalk_1.default.bold.blue);
                resolve(to);
            });
            arch.finalize();
        });
    };
    Compressor.prototype.log = function (text, formatter) {
        if (formatter === void 0) { formatter = chalk_1.default; }
        if (!this.logging) {
            return;
        }
        console.log(formatter(text));
    };
    return Compressor;
}());
exports.default = Compressor;
;
