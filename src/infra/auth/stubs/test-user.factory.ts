import type { TestHelpers } from 'better-auth/plugins';
import { type BetterAuthInstance } from '@/infra/auth/auth.factory';
import type { UserId } from '@/infra/auth/auth.schema';

export class TestAuthContext {
  private _defaultUserId?: UserId;

  constructor(private readonly testHelpers: TestHelpers) {}

  static async from(auth: BetterAuthInstance): Promise<TestAuthContext> {
    const { test } = (await auth.$context) as unknown as { test: TestHelpers };
    return new TestAuthContext(test);
  }

  async defaultUserId(): Promise<UserId> {
    if (!this._defaultUserId) {
      this._defaultUserId = await this.createUser();
    }
    return this._defaultUserId;
  }

  async createUser(): Promise<UserId> {
    const user = this.testHelpers.createUser({
      email: `test-${crypto.randomUUID()}@example.com`,
      name: 'Test User',
    });
    const saved = await this.testHelpers.saveUser(user);
    return saved.id;
  }

  async dropUser(userId: UserId): Promise<void> {
    await this.testHelpers.deleteUser(userId);
  }

  async getAuthHeaders(userId: UserId): Promise<Record<string, string>> {
    const headers = await this.testHelpers.getAuthHeaders({ userId });
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}
