"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var path = __importStar(require("path"));
var fs = __importStar(require("fs-extra"));
var chalk_1 = __importDefault(require("chalk"));
var readline_sync_1 = __importDefault(require("readline-sync"));
var ssh_1 = __importDefault(require("./utils/ssh"));
var FolderUploadWebpackPlugin = /** @class */ (function () {
    function FolderUploadWebpackPlugin(options) {
        if (options === void 0) { options = { server: [] }; }
        if (!options.paths) {
            throw new Error('paths not set');
        }
        options.enable = options.enable === undefined ? true : options.enable;
        options.clear = options.clear || false;
        options.logging = !options.logging ? false : options.logging;
        options.progress = !options.progress ? true : options.progress;
        // options.folderName = options.folder.match(/([^\/]*)\/*$/)[1];
        options.firstEmit = options.firstEmit === undefined ? true : options.firstEmit;
        options.chmod = !options.chmod ? 420 : options.chmod;
        options.archive = options.archive ? options.archive : 'FolderUploadWebpackPlugin.zip';
        options.ignore = options.ignore ? options.ignore : null;
        this.ssh = new ssh_1.default(options.logging, options.progress, options.streams);
        options.confirmation = options.confirmation ? options.confirmation : false;
        this.paths = options.paths ? options.paths() : {};
        options.after = options.after ? options.after : [];
        options.before = options.before ? options.before : [];
        this.pathList = [];
        this.cl = {};
        this.options = options;
        this.upload = this.upload.bind(this);
    }
    FolderUploadWebpackPlugin.prototype.apply = function (compiler) {
        if (!this.options.enable)
            return;
        compiler.hooks.afterDone.tap('folder-upload-webpack-plugin', this.upload);
    };
    FolderUploadWebpackPlugin.prototype.pathConverter = function (local, remote, size) {
        if (size === void 0) { size = 0; }
        return {
            name: path.basename(local),
            path: path.dirname(local),
            remotePath: path.resolve(remote) + '/',
            fillPath: local,
            size: size
        };
    };
    FolderUploadWebpackPlugin.prototype.walk = function (dirs) {
        for (var i in dirs) {
            var stat = fs.statSync(i);
            if (!stat.isDirectory()) {
                if (!this.options.ignore || !path.join(i).match(this.options.ignore)) {
                    this.pathList.push(this.pathConverter(path.join(i), path.join(dirs[i]), stat.size));
                    this.cl[path.join(dirs[i], '/')] = true;
                }
                continue;
            }
            var files = fs.readdirSync(i);
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
                var stat_1 = fs.statSync(path.join(i, file));
                if (stat_1.isDirectory()) {
                    var data = {};
                    data[path.join(i, file)] = path.join(dirs[i], file);
                    this.pathList.concat(this.walk(data));
                }
                else {
                    if (!this.options.ignore || !path.join(i, file).match(this.options.ignore)) {
                        this.pathList.push(this.pathConverter(path.join(i, file), path.join(dirs[i]), stat_1.size));
                        this.cl[path.join(dirs[i], '/')] = true;
                    }
                }
            }
        }
        return [this.pathList, Object.keys(this.cl)];
    };
    FolderUploadWebpackPlugin.prototype.handleScript = function (script) {
        var _a = script.split(' '), command = _a[0], args = _a.slice(1);
        child_process_1.spawnSync(command, args, { stdio: 'inherit' });
    };
    FolderUploadWebpackPlugin.prototype.upload = function (compilation) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, clear, chmod, server, i, _b, _c, _i, i, _d, filesList, cl, _e, _f, _g, i_1, e_1, _h, _j, _k, i_2, dir, e_2, i;
            return __generator(this, function (_l) {
                switch (_l.label) {
                    case 0:
                        _a = this.options, clear = _a.clear, chmod = _a.chmod, server = _a.server;
                        if (this.options.before && this.options.before.length) {
                            for (i in this.options.before) {
                                this.handleScript(this.options.before[i]);
                            }
                        }
                        if (!(!this.options.confirmation || readline_sync_1.default.keyInYN(chalk_1.default.bold.red("\nAre you sure you want to replace the server?")))) return [3 /*break*/, 22];
                        if (!this.options.firstEmit) return [3 /*break*/, 22];
                        _b = [];
                        for (_c in server)
                            _b.push(_c);
                        _i = 0;
                        _l.label = 1;
                    case 1:
                        if (!(_i < _b.length)) return [3 /*break*/, 22];
                        i = _b[_i];
                        return [4 /*yield*/, this.walk(this.paths)];
                    case 2:
                        _d = _l.sent(), filesList = _d[0], cl = _d[1];
                        server[i].port = server[i].port || 22;
                        return [4 /*yield*/, this.ssh.connect(server[i])];
                    case 3:
                        _l.sent();
                        _e = [];
                        for (_f in this.paths)
                            _e.push(_f);
                        _g = 0;
                        _l.label = 4;
                    case 4:
                        if (!(_g < _e.length)) return [3 /*break*/, 9];
                        i_1 = _e[_g];
                        if (!clear) return [3 /*break*/, 8];
                        _l.label = 5;
                    case 5:
                        _l.trys.push([5, 7, , 8]);
                        this.log('Clearing remote folder ' + this.paths[i_1] + '* ...', chalk_1.default.red);
                        return [4 /*yield*/, this.ssh.rmdir('rm -rf ' + formatRemotePath(this.paths[i_1]) + '*')];
                    case 6:
                        _l.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        e_1 = _l.sent();
                        return [3 /*break*/, 8];
                    case 8:
                        _g++;
                        return [3 /*break*/, 4];
                    case 9:
                        _h = [];
                        for (_j in cl)
                            _h.push(_j);
                        _k = 0;
                        _l.label = 10;
                    case 10:
                        if (!(_k < _h.length)) return [3 /*break*/, 18];
                        i_2 = _h[_k];
                        dir = formatRemotePath(cl[i_2]);
                        _l.label = 11;
                    case 11:
                        _l.trys.push([11, 16, , 17]);
                        return [4 /*yield*/, this.ssh.exists(dir)];
                    case 12:
                        if (!!(_l.sent())) return [3 /*break*/, 15];
                        this.log('MAKE remote folder ' + dir + ' ...', chalk_1.default.green);
                        return [4 /*yield*/, this.ssh.mkdir(dir, true).catch(function () { return null; })];
                    case 13:
                        _l.sent();
                        return [4 /*yield*/, this.ssh.chmod(dir, chmod).catch(function () { return null; })];
                    case 14:
                        _l.sent();
                        _l.label = 15;
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        e_2 = _l.sent();
                        return [3 /*break*/, 17];
                    case 17:
                        _k++;
                        return [3 /*break*/, 10];
                    case 18:
                        this.log('Uploading...', chalk_1.default.green);
                        return [4 /*yield*/, this.ssh.sendFile(filesList)];
                    case 19:
                        _l.sent();
                        this.log('end', chalk_1.default.green);
                        return [4 /*yield*/, this.ssh.end()];
                    case 20:
                        _l.sent();
                        _l.label = 21;
                    case 21:
                        _i++;
                        return [3 /*break*/, 1];
                    case 22:
                        this.options.firstEmit = false;
                        if (this.options.symlink) {
                            this.log('Making symlink...', chalk_1.default.green);
                            this.createSimlinks(this.options.symlink, compilation.compilation.compiler.outputPath, clear);
                        }
                        if (this.options.after && this.options.after.length) {
                            for (i in this.options.after) {
                                this.handleScript(this.options.after[i]);
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    FolderUploadWebpackPlugin.prototype.createSimlinks = function (options, inputPath, clear) {
        if (options.force || fs.existsSync(inputPath)) {
            var baseDir = process.cwd();
            process.chdir(inputPath);
            var origin_1 = path.relative(path.dirname(options.path), inputPath);
            this.log('Symlink path: ' + origin_1, chalk_1.default.green);
            try {
                if (clear) {
                    if (fs.existsSync(options.path)) {
                        fs.removeSync(options.path);
                    }
                }
                fs.readlinkSync(options.path); // Raises if symlink doesn't exist
                fs.unlinkSync(options.path);
            }
            catch (e) {
                // symlink doesn't exist
            }
            finally {
                fs.symlinkSync(origin_1, options.path);
            }
            process.chdir(baseDir);
        }
        if (clear) {
            var parentPath = path.dirname(inputPath);
            var ignore = path.basename(inputPath);
            var dirs = fs.readdirSync(parentPath);
            for (var i in dirs) {
                if (!fs.statSync(path.join(parentPath, dirs[i])).isDirectory() || dirs[i] === ignore)
                    continue;
                fs.removeSync(path.join(parentPath, dirs[i]));
            }
        }
    };
    FolderUploadWebpackPlugin.prototype.log = function (text, formatter) {
        if (formatter === void 0) { formatter = chalk_1.default.blue; }
        if (!this.options.logging) {
            return;
        }
        console.log(formatter(text));
    };
    return FolderUploadWebpackPlugin;
}());
exports.default = FolderUploadWebpackPlugin;
function formatRemotePath(remotePath, filePath) {
    if (filePath === void 0) { filePath = ''; }
    return (remotePath + '/' + filePath).replace(/\\/g, '/').replace(/\.\//g, "").replace(/\/\/+/g, "/");
}
