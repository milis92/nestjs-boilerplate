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
(0, vitest_1.describe)('Widgets REST API', function () {
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
    // ── GET /widgets ────────────────────────────────────────────────
    (0, vitest_1.describe)('GET /widgets', function () {
        (0, vitest_1.describe)('given no existing widgets', function () {
            (0, vitest_1.it)('returns empty array', function () { return __awaiter(void 0, void 0, void 0, function () {
                var client, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, app.client()];
                        case 1:
                            client = _a.sent();
                            return [4 /*yield*/, client.get('/api/widgets').expect(200)];
                        case 2:
                            response = _a.sent();
                            (0, vitest_1.expect)(response.body).toEqual([]);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        (0, vitest_1.describe)('given existing widgets', function () {
            (0, vitest_1.it)('returns all widgets for the user', function () { return __awaiter(void 0, void 0, void 0, function () {
                var client, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, test_widget_factory_1.createTestWidget)(app.database, testUserId, {
                                name: 'Alpha',
                            })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, (0, test_widget_factory_1.createTestWidget)(app.database, testUserId, {
                                    name: 'Beta',
                                })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, app.client()];
                        case 3:
                            client = _a.sent();
                            return [4 /*yield*/, client.get('/api/widgets').expect(200)];
                        case 4:
                            response = _a.sent();
                            (0, vitest_1.expect)(response.body).toHaveLength(2);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    // ── GET /widgets/:id ────────────────────────────────────────────
    (0, vitest_1.describe)('GET /widgets/:id', function () {
        (0, vitest_1.it)('returns the widget', function () { return __awaiter(void 0, void 0, void 0, function () {
            var row, client, response, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, test_widget_factory_1.createTestWidget)(app.database, testUserId, {
                            name: 'My Widget',
                        })];
                    case 1:
                        row = _a.sent();
                        return [4 /*yield*/, app.client()];
                    case 2:
                        client = _a.sent();
                        return [4 /*yield*/, client
                                .get("/api/widgets/".concat(row.id))
                                .expect(200)];
                    case 3:
                        response = _a.sent();
                        body = response.body;
                        (0, vitest_1.expect)(body.name).toBe('My Widget');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns 404 for non-existent ID', function () { return __awaiter(void 0, void 0, void 0, function () {
            var client, response, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.client()];
                    case 1:
                        client = _a.sent();
                        return [4 /*yield*/, client
                                .get("/api/widgets/".concat(test_constants_1.NON_EXISTENT_UUID))
                                .expect(404)];
                    case 2:
                        response = _a.sent();
                        body = response.body;
                        (0, vitest_1.expect)(body.statusCode).toBe(404);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ── POST /widgets ───────────────────────────────────────────────
    (0, vitest_1.describe)('POST /widgets', function () {
        (0, vitest_1.describe)('given a valid request', function () {
            (0, vitest_1.it)('creates and returns the widget with default status', function () { return __awaiter(void 0, void 0, void 0, function () {
                var client, response, body;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, app.client()];
                        case 1:
                            client = _a.sent();
                            return [4 /*yield*/, client
                                    .post('/api/widgets')
                                    .send({ name: 'New Widget' })
                                    .expect(201)];
                        case 2:
                            response = _a.sent();
                            body = response.body;
                            (0, vitest_1.expect)(body.name).toBe('New Widget');
                            (0, vitest_1.expect)(body.status).toBe('active');
                            (0, vitest_1.expect)(body.id).toBeDefined();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        (0, vitest_1.describe)('given an invalid request body', function () {
            (0, vitest_1.it)('returns 422 for missing required fields', function () { return __awaiter(void 0, void 0, void 0, function () {
                var client;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, app.client()];
                        case 1:
                            client = _a.sent();
                            return [4 /*yield*/, client.post('/api/widgets').send({}).expect(422)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    // ── PATCH /widgets/:id ──────────────────────────────────────────
    (0, vitest_1.describe)('PATCH /widgets/:id', function () {
        (0, vitest_1.it)('updates and returns the widget', function () { return __awaiter(void 0, void 0, void 0, function () {
            var row, client, response, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, test_widget_factory_1.createTestWidget)(app.database, testUserId)];
                    case 1:
                        row = _a.sent();
                        return [4 /*yield*/, app.client()];
                    case 2:
                        client = _a.sent();
                        return [4 /*yield*/, client
                                .patch("/api/widgets/".concat(row.id))
                                .send({ name: 'Updated' })
                                .expect(200)];
                    case 3:
                        response = _a.sent();
                        body = response.body;
                        (0, vitest_1.expect)(body.name).toBe('Updated');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns 404 for non-existent widget', function () { return __awaiter(void 0, void 0, void 0, function () {
            var client;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.client()];
                    case 1:
                        client = _a.sent();
                        return [4 /*yield*/, client
                                .patch("/api/widgets/".concat(test_constants_1.NON_EXISTENT_UUID))
                                .send({ name: 'X' })
                                .expect(404)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ── DELETE /widgets/:id ─────────────────────────────────────────
    (0, vitest_1.describe)('DELETE /widgets/:id', function () {
        (0, vitest_1.it)('deletes the widget and returns 204', function () { return __awaiter(void 0, void 0, void 0, function () {
            var row, client;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, test_widget_factory_1.createTestWidget)(app.database, testUserId)];
                    case 1:
                        row = _a.sent();
                        return [4 /*yield*/, app.client()];
                    case 2:
                        client = _a.sent();
                        return [4 /*yield*/, client.delete("/api/widgets/".concat(row.id)).expect(204)];
                    case 3:
                        _a.sent();
                        // Verify deletion
                        return [4 /*yield*/, client.get("/api/widgets/".concat(row.id)).expect(404)];
                    case 4:
                        // Verify deletion
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns 404 for non-existent widget', function () { return __awaiter(void 0, void 0, void 0, function () {
            var client;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.client()];
                    case 1:
                        client = _a.sent();
                        return [4 /*yield*/, client
                                .delete("/api/widgets/".concat(test_constants_1.NON_EXISTENT_UUID))
                                .expect(404)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
