"use strict";
// Example: src/domain/widget/graphql/widgets.resolver.ts
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
exports.WidgetsResolver = void 0;
var graphql_1 = require("@nestjs/graphql");
var common_1 = require("@nestjs/common");
var error_filter_1 = require("@/domain/shared/errors/error.filter");
var widget_object_1 = require("./widget.object");
var WidgetsResolver = function () {
    var _classDecorators = [(0, graphql_1.Resolver)(function () { return widget_object_1.WidgetObject; }), (0, common_1.UseFilters)(error_filter_1.ServiceErrorFilter)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _widgets_decorators;
    var _widget_decorators;
    var _createWidget_decorators;
    var _updateWidget_decorators;
    var _deleteWidget_decorators;
    var WidgetsResolver = _classThis = /** @class */ (function () {
        function WidgetsResolver_1(widgetsService) {
            this.widgetsService = (__runInitializers(this, _instanceExtraInitializers), widgetsService);
        }
        WidgetsResolver_1.prototype.widgets = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                var widgets;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetsService.all(user.id)];
                        case 1:
                            widgets = _a.sent();
                            return [2 /*return*/, widget_object_1.WidgetObject.fromDomainList(widgets)];
                    }
                });
            });
        };
        WidgetsResolver_1.prototype.widget = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                var widget;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetsService.single(user.id, id)];
                        case 1:
                            widget = _a.sent();
                            if (!widget)
                                throw new common_1.NotFoundException("Widget with id '".concat(id, "' not found"));
                            return [2 /*return*/, widget_object_1.WidgetObject.fromDomain(widget)];
                    }
                });
            });
        };
        WidgetsResolver_1.prototype.createWidget = function (user, input) {
            return __awaiter(this, void 0, void 0, function () {
                var domain, widget;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            domain = {
                                name: input.name,
                                description: (_a = input.description) !== null && _a !== void 0 ? _a : null,
                                status: 'active',
                                priority: (_b = input.priority) !== null && _b !== void 0 ? _b : 0,
                            };
                            return [4 /*yield*/, this.widgetsService.create(user.id, domain)];
                        case 1:
                            widget = _c.sent();
                            return [2 /*return*/, widget_object_1.WidgetObject.fromDomain(widget)];
                    }
                });
            });
        };
        WidgetsResolver_1.prototype.updateWidget = function (user, id, input) {
            return __awaiter(this, void 0, void 0, function () {
                var domain, widget;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            domain = __assign(__assign(__assign({}, (input.name !== undefined && { name: input.name })), (input.description !== undefined && {
                                description: (_a = input.description) !== null && _a !== void 0 ? _a : null,
                            })), (input.priority !== undefined && {
                                priority: input.priority,
                            }));
                            return [4 /*yield*/, this.widgetsService.update(user.id, id, domain)];
                        case 1:
                            widget = _b.sent();
                            return [2 /*return*/, widget_object_1.WidgetObject.fromDomain(widget)];
                    }
                });
            });
        };
        WidgetsResolver_1.prototype.deleteWidget = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetsService.delete(user.id, id)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, true];
                    }
                });
            });
        };
        return WidgetsResolver_1;
    }());
    __setFunctionName(_classThis, "WidgetsResolver");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _widgets_decorators = [(0, graphql_1.Query)(function () { return [widget_object_1.WidgetObject]; }, { name: 'widgets' })];
        _widget_decorators = [(0, graphql_1.Query)(function () { return widget_object_1.WidgetObject; }, { name: 'widget' })];
        _createWidget_decorators = [(0, graphql_1.Mutation)(function () { return widget_object_1.WidgetObject; }, {
                description: 'Create a new widget',
            })];
        _updateWidget_decorators = [(0, graphql_1.Mutation)(function () { return widget_object_1.WidgetObject; }, {
                description: 'Update an existing widget',
            })];
        _deleteWidget_decorators = [(0, graphql_1.Mutation)(function () { return Boolean; }, { description: 'Delete a widget' })];
        __esDecorate(_classThis, null, _widgets_decorators, { kind: "method", name: "widgets", static: false, private: false, access: { has: function (obj) { return "widgets" in obj; }, get: function (obj) { return obj.widgets; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _widget_decorators, { kind: "method", name: "widget", static: false, private: false, access: { has: function (obj) { return "widget" in obj; }, get: function (obj) { return obj.widget; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createWidget_decorators, { kind: "method", name: "createWidget", static: false, private: false, access: { has: function (obj) { return "createWidget" in obj; }, get: function (obj) { return obj.createWidget; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateWidget_decorators, { kind: "method", name: "updateWidget", static: false, private: false, access: { has: function (obj) { return "updateWidget" in obj; }, get: function (obj) { return obj.updateWidget; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteWidget_decorators, { kind: "method", name: "deleteWidget", static: false, private: false, access: { has: function (obj) { return "deleteWidget" in obj; }, get: function (obj) { return obj.deleteWidget; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WidgetsResolver = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WidgetsResolver = _classThis;
}();
exports.WidgetsResolver = WidgetsResolver;
