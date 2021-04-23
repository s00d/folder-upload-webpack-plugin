"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var console = __importStar(require("console"));
var ssh2_1 = require("ssh2");
var ssh2_sftp_client_1 = __importDefault(require("ssh2-sftp-client"));
var chalk_1 = __importDefault(require("chalk"));
var path_1 = __importDefault(require("path"));
var ProgressBar_1 = __importDefault(require("./ProgressBar"));
var timers_1 = require("timers");
var fs = require('fs');
var promiseRepeat = function (promise, ms, attempt) {
    var _this = this;
    if (ms === void 0) { ms = 3000; }
    if (attempt === void 0) { attempt = 0; }
    return new Promise(function (resolve, reject) {
        promiseTimeout(promise, ms).then(function (result) {
            resolve(result);
        }).catch(function (err) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        attempt++;
                        if (!(attempt < 3)) return [3 /*break*/, 2];
                        return [4 /*yield*/, promiseRepeat(promise, ms, attempt)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        reject(err);
                        return [2 /*return*/];
                }
            });
        }); });
    });
};
var promiseTimeout = function (promise, ms) {
    if (ms === void 0) { ms = 3000; }
    var timeout = new Promise(function (resolve, reject) {
        var id = setTimeout(function () {
            timers_1.clearTimeout(id);
            reject('Timed out in ' + ms + 'ms.');
        }, ms);
    });
    return Promise.race([
        promise,
        timeout
    ]);
};
var SshClient = /** @class */ (function () {
    function SshClient(log, progress, streams) {
        if (log === void 0) { log = false; }
        if (progress === void 0) { progress = true; }
        if (streams === void 0) { streams = 10; }
        this.streams = 10;
        this.logging = log;
        this.progress = progress;
        this.streams = streams;
    }
    SshClient.prototype.connect = function (options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.options = options;
                        this.sftp = new ssh2_sftp_client_1.default();
                        return [4 /*yield*/, this.sftp.connect(__assign({}, this.options))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SshClient.prototype.ssh2connect = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var conn = new ssh2_1.Client();
                            conn.on('ready', function () { return resolve(conn); }).on('error', reject).connect(config);
                            return conn;
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    SshClient.prototype.exists = function (remotePath) {
        return __awaiter(this, void 0, void 0, function () {
            var exits;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sftp.exists(remotePath)];
                    case 1:
                        exits = _a.sent();
                        return [2 /*return*/, !!exits];
                }
            });
        });
    };
    SshClient.prototype.mkdir = function (remotePath, recursive) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sftp.mkdir(remotePath, recursive)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    SshClient.prototype.rmdir = function (remotePath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sftp.rmdir(remotePath)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    SshClient.prototype.sendFile = function (files) {
        return __awaiter(this, void 0, void 0, function () {
            var self, uploaded, pb, sliced_array_1, i_1, _a, _b, _i, i_2;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        self = this;
                        uploaded = 0;
                        pb = new ProgressBar_1.default('Sending...', 20);
                        if (!(files.length > 0)) return [3 /*break*/, 4];
                        sliced_array_1 = [];
                        i_1 = 0;
                        files.map(function (item) {
                            if (!sliced_array_1[i_1])
                                sliced_array_1[i_1] = [];
                            sliced_array_1[i_1].push(item);
                            if (sliced_array_1[i_1].length > _this.streams)
                                i_1++;
                        });
                        _a = [];
                        for (_b in sliced_array_1)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        i_2 = _a[_i];
                        return [4 /*yield*/, Promise.all(sliced_array_1[i_2].map(function (file) {
                                if (!fs.existsSync(file.fillPath)) {
                                    throw new Error("File: " + file.fillPath + " not exist!");
                                }
                                var remoteFile = path_1.default.resolve(file.remotePath + file.name);
                                _this.log('Put: ' + file.fillPath + ' to server ' + remoteFile, chalk_1.default.yellow);
                                return _this.sftp.fastPut(file.fillPath, remoteFile, { mode: 511 }).then(function (result) {
                                    uploaded++;
                                    self.progress && pb.render({
                                        percent: parseFloat((uploaded / files.length).toFixed(4)),
                                        completed: uploaded,
                                        total: files.length,
                                    });
                                }).catch(function (err) {
                                    _this.log(err, chalk_1.default.red.bold);
                                    return function retry() {
                                        return __awaiter(this, void 0, void 0, function () {
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, self.sftp.fastPut(file.fillPath, remoteFile, { mode: 511 })];
                                                    case 1: return [2 /*return*/, _a.sent()];
                                                }
                                            });
                                        });
                                    }();
                                });
                            })).catch(function (err) {
                                _this.log(err, chalk_1.default.red.bold);
                            })];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SshClient.prototype.symlink = function (remotePath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sftp.mkdir(remotePath, true)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    SshClient.prototype.delete = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sftp.delete(path)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    SshClient.prototype.chmod = function (path, chmod) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sftp.chmod(path, chmod)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    SshClient.prototype.end = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sftp.end()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SshClient.prototype.log = function (text, formatter) {
        if (formatter === void 0) { formatter = chalk_1.default; }
        if (!this.logging) {
            return;
        }
        console.log(formatter(text));
    };
    return SshClient;
}());
exports.default = SshClient;
