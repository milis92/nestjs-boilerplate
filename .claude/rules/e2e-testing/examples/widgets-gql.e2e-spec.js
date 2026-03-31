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
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var drizzle_orm_1 = require("drizzle-orm");
var test_application_context_1 = require("../test-application.context");
var schema_1 = require("@/infra/drizzle/schema");
var test_constants_1 = require("@/testing/test-constants");
var test_widget_factory_1 = require("@/domain/widget/stubs/test-widget.factory");
(0, vitest_1.describe)('Widgets GraphQL API', function () {
    var app;
    var testUserId;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_application_context_1.TestApplicationContext.create()];
                case 1:
                    app = _a.sent();
                    return [4 /*yield*/, app.auth.defaultUserId()];
                case 2:
                    testUserId = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 120000);
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, app.teardown()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.afterEach)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, app.database
                        .delete(schema_1.widgets)
                        .where((0, drizzle_orm_1.eq)(schema_1.widgets.ownerId, testUserId))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    // ── Query: widgets ──────────────────────────────────────────────
    (0, vitest_1.describe)('Query: widgets', function () {
        (0, vitest_1.it)('returns empty array when no widgets exist', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, app.executeGraphql({
                            query: "query { widgets { id name } }",
                        })];
                    case 1:
                        result = _b.sent();
                        (0, vitest_1.expect)(result.errors).toBeUndefined();
                        (0, vitest_1.expect)((_a = result.data) === null || _a === void 0 ? void 0 : _a.widgets).toEqual([]);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns all widgets for the user', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, test_widget_factory_1.createTestWidget)(app.database, testUserId, {
                            name: 'Alpha',
                        })];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, (0, test_widget_factory_1.createTestWidget)(app.database, testUserId, {
                                name: 'Beta',
                            })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, app.executeGraphql({
                                query: "query { widgets { id name status } }",
                            })];
                    case 3:
                        result = _b.sent();
                        (0, vitest_1.expect)(result.errors).toBeUndefined();
                        (0, vitest_1.expect)((_a = result.data) === null || _a === void 0 ? void 0 : _a.widgets).toHaveLength(2);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ── Query: widget ───────────────────────────────────────────────
    (0, vitest_1.describe)('Query: widget', function () {
        (0, vitest_1.it)('returns a single widget', function () { return __awaiter(void 0, void 0, void 0, function () {
            var row, result;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, (0, test_widget_factory_1.createTestWidget)(app.database, testUserId, {
                            name: 'My Widget',
                        })];
                    case 1:
                        row = _c.sent();
                        return [4 /*yield*/, app.executeGraphql({
                                query: "query Widget($id: ID!) { widget(id: $id) { id name description status } }",
                                variables: { id: row.id },
                            })];
                    case 2:
                        result = _c.sent();
                        (0, vitest_1.expect)(result.errors).toBeUndefined();
                        (0, vitest_1.expect)((_a = result.data) === null || _a === void 0 ? void 0 : _a.widget.name).toBe('My Widget');
                        (0, vitest_1.expect)((_b = result.data) === null || _b === void 0 ? void 0 : _b.widget.status).toBe('ACTIVE');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns error for non-existent ID', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.executeGraphql({
                            query: "query Widget($id: ID!) { widget(id: $id) { id } }",
                            variables: { id: test_constants_1.NON_EXISTENT_UUID },
                        })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ── Mutation: createWidget ──────────────────────────────────────
    (0, vitest_1.describe)('Mutation: createWidget', function () {
        (0, vitest_1.describe)('given valid input', function () {
            (0, vitest_1.it)('creates and returns the widget', function () { return __awaiter(void 0, void 0, void 0, function () {
                var result;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, app.executeGraphql({
                                query: "mutation CreateWidget($input: CreateWidgetInput!) {\n            createWidget(input: $input) { id name status }\n          }",
                                variables: { input: { name: 'New Widget' } },
                            })];
                        case 1:
                            result = _d.sent();
                            (0, vitest_1.expect)(result.errors).toBeUndefined();
                            (0, vitest_1.expect)((_a = result.data) === null || _a === void 0 ? void 0 : _a.createWidget.name).toBe('New Widget');
                            (0, vitest_1.expect)((_b = result.data) === null || _b === void 0 ? void 0 : _b.createWidget.status).toBe('ACTIVE');
                            (0, vitest_1.expect)((_c = result.data) === null || _c === void 0 ? void 0 : _c.createWidget.id).toBeDefined();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    // ── Mutation: updateWidget ──────────────────────────────────────
    (0, vitest_1.describe)('Mutation: updateWidget', function () {
        (0, vitest_1.it)('updates and returns the widget', function () { return __awaiter(void 0, void 0, void 0, function () {
            var row, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, test_widget_factory_1.createTestWidget)(app.database, testUserId, {
                            name: 'Original',
                        })];
                    case 1:
                        row = _b.sent();
                        return [4 /*yield*/, app.executeGraphql({
                                query: "mutation UpdateWidget($id: ID!, $input: UpdateWidgetInput!) {\n          updateWidget(id: $id, input: $input) { name description }\n        }",
                                variables: { id: row.id, input: { name: 'Updated' } },
                            })];
                    case 2:
                        result = _b.sent();
                        (0, vitest_1.expect)(result.errors).toBeUndefined();
                        (0, vitest_1.expect)((_a = result.data) === null || _a === void 0 ? void 0 : _a.updateWidget.name).toBe('Updated');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns error for non-existent widget', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.executeGraphql({
                            query: "mutation UpdateWidget($id: ID!, $input: UpdateWidgetInput!) {\n          updateWidget(id: $id, input: $input) { id }\n        }",
                            variables: { id: test_constants_1.NON_EXISTENT_UUID, input: { name: 'X' } },
                        })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ── Mutation: deleteWidget ──────────────────────────────────────
    (0, vitest_1.describe)('Mutation: deleteWidget', function () {
        (0, vitest_1.it)('deletes the widget and returns true', function () { return __awaiter(void 0, void 0, void 0, function () {
            var row, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, test_widget_factory_1.createTestWidget)(app.database, testUserId)];
                    case 1:
                        row = _b.sent();
                        return [4 /*yield*/, app.executeGraphql({
                                query: "mutation DeleteWidget($id: ID!) { deleteWidget(id: $id) }",
                                variables: { id: row.id },
                            })];
                    case 2:
                        result = _b.sent();
                        (0, vitest_1.expect)(result.errors).toBeUndefined();
                        (0, vitest_1.expect)((_a = result.data) === null || _a === void 0 ? void 0 : _a.deleteWidget).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns error for non-existent widget', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.executeGraphql({
                            query: "mutation DeleteWidget($id: ID!) { deleteWidget(id: $id) }",
                            variables: { id: test_constants_1.NON_EXISTENT_UUID },
                        })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
