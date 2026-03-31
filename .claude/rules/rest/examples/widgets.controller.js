"use strict";
// Example: src/domain/widget/rest/widgets.controller.ts
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetsController = void 0;
var common_1 = require("@nestjs/common");
var error_filter_1 = require("@/domain/shared/errors/error.filter");
var openapi_controller_decorator_1 = require("@/tools/openapi/openapi-controller.decorator");
var openapi_endpoint_decorator_1 = require("@/tools/openapi/openapi-endpoint.decorator");
var widget_response_1 = require("./responses/widget.response");
var WidgetsController = function () {
    var _classDecorators = [(0, common_1.Controller)('widgets'), (0, common_1.UseFilters)(error_filter_1.ServiceErrorFilter), (0, openapi_controller_decorator_1.OpenApiController)('Widgets')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _all_decorators;
    var _single_decorators;
    var _create_decorators;
    var _update_decorators;
    var _remove_decorators;
    var WidgetsController = _classThis = /** @class */ (function () {
        function WidgetsController_1(widgetsService) {
            this.widgetsService = (__runInitializers(this, _instanceExtraInitializers), widgetsService);
        }
        WidgetsController_1.prototype.all = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                var widgets;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetsService.all(user.id)];
                        case 1:
                            widgets = _a.sent();
                            return [2 /*return*/, widget_response_1.WidgetResponse.fromDomainList(widgets)];
                    }
                });
            });
        };
        WidgetsController_1.prototype.single = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                var widget;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetsService.single(user.id, id)];
                        case 1:
                            widget = _a.sent();
                            if (!widget)
                                throw new common_1.NotFoundException("Widget with id '".concat(id, "' not found"));
                            return [2 /*return*/, widget_response_1.WidgetResponse.fromDomain(widget)];
                    }
                });
            });
        };
        WidgetsController_1.prototype.create = function (user, request) {
            return __awaiter(this, void 0, void 0, function () {
                var widget;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetsService.create(user.id, request.toDomain())];
                        case 1:
                            widget = _a.sent();
                            return [2 /*return*/, widget_response_1.WidgetResponse.fromDomain(widget)];
                    }
                });
            });
        };
        WidgetsController_1.prototype.update = function (user, id, request) {
            return __awaiter(this, void 0, void 0, function () {
                var widget;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetsService.update(user.id, id, request.toDomain())];
                        case 1:
                            widget = _a.sent();
                            return [2 /*return*/, widget_response_1.WidgetResponse.fromDomain(widget)];
                    }
                });
            });
        };
        WidgetsController_1.prototype.remove = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetsService.delete(user.id, id)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        return WidgetsController_1;
    }());
    __setFunctionName(_classThis, "WidgetsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _all_decorators = [(0, common_1.Get)(), (0, openapi_endpoint_decorator_1.OpenApiEndpoint)({
                summary: 'List all widgets',
                type: [widget_response_1.WidgetResponse],
            })];
        _single_decorators = [(0, common_1.Get)(':id'), (0, openapi_endpoint_decorator_1.OpenApiEndpoint)({
                summary: 'Get a widget by ID',
                type: widget_response_1.WidgetResponse,
            })];
        _create_decorators = [(0, common_1.Post)(), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, openapi_endpoint_decorator_1.OpenApiEndpoint)({
                summary: 'Create a new widget',
                status: common_1.HttpStatus.CREATED,
                type: widget_response_1.WidgetResponse,
            })];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, openapi_endpoint_decorator_1.OpenApiEndpoint)({
                summary: 'Update a widget',
                type: widget_response_1.WidgetResponse,
            })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT), (0, openapi_endpoint_decorator_1.OpenApiEndpoint)({
                summary: 'Delete a widget',
                status: common_1.HttpStatus.NO_CONTENT,
            })];
        __esDecorate(_classThis, null, _all_decorators, { kind: "method", name: "all", static: false, private: false, access: { has: function (obj) { return "all" in obj; }, get: function (obj) { return obj.all; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _single_decorators, { kind: "method", name: "single", static: false, private: false, access: { has: function (obj) { return "single" in obj; }, get: function (obj) { return obj.single; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WidgetsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WidgetsController = _classThis;
}();
exports.WidgetsController = WidgetsController;
