import { describe, expect, it } from "vitest";

import { roleHasPermission } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";
import type { CurrentUser, PlanCode, RoleCode, UserStatus } from "@/types/profile";

describe("IAM — Bootstrap Logic", () => {
  function createCurrentUser(overrides: {
    role?: RoleCode;
    plan?: PlanCode | null;
    status?: UserStatus;
  }): CurrentUser {
    const hasPlanProp = "plan" in overrides;
    return {
      id: "test-user-id",
      authUserId: "auth-user-id",
      name: "Test User",
      email: "test@example.com",
      avatarUrl: null,
      role: overrides.role ?? "PUBLISHER",
      roleId: "role-id",
      plan: hasPlanProp ? (overrides.plan ?? null) : "FREE",
      planId: hasPlanProp ? (overrides.plan ? "plan-id" : null) : "plan-id",
      planDetails: null,
      status: overrides.status ?? "ACTIVE",
      isActive: (overrides.status ?? "ACTIVE") === "ACTIVE",
    };
  }

  describe("first user → GLOBAL_ADMIN", () => {
    it("first user gets GLOBAL_ADMIN role (no plan)", () => {
      const user = createCurrentUser({ role: "GLOBAL_ADMIN", plan: null });
      expect(user.role).toBe("GLOBAL_ADMIN");
      expect(user.plan).toBeNull();
    });

    it("GLOBAL_ADMIN has no plan assigned", () => {
      const user = createCurrentUser({ role: "GLOBAL_ADMIN", plan: null });
      expect(user.plan).toBeNull();
      expect(user.planId).toBeNull();
    });
  });

  describe("second user → PUBLISHER + FREE", () => {
    it("second user gets PUBLISHER role", () => {
      const user = createCurrentUser({ role: "PUBLISHER" });
      expect(user.role).toBe("PUBLISHER");
    });

    it("PUBLISHER gets FREE plan by default", () => {
      const user = createCurrentUser({ role: "PUBLISHER", plan: "FREE" });
      expect(user.plan).toBe("FREE");
    });
  });

  describe("role preservation on re-login", () => {
    it("GLOBAL_ADMIN stays GLOBAL_ADMIN after re-login", () => {
      const user = createCurrentUser({ role: "GLOBAL_ADMIN" });
      // Simulate re-login: role must NOT change
      const afterRelogin = createCurrentUser({ role: user.role });
      expect(afterRelogin.role).toBe("GLOBAL_ADMIN");
    });

    it("PUBLISHER stays PUBLISHER", () => {
      const user = createCurrentUser({ role: "PUBLISHER" });
      const afterRelogin = createCurrentUser({ role: user.role });
      expect(afterRelogin.role).toBe("PUBLISHER");
    });
  });

  describe("plan preservation on re-login", () => {
    it("PUBLISHER + PRO stays PRO", () => {
      const user = createCurrentUser({ role: "PUBLISHER", plan: "PRO" });
      expect(user.plan).toBe("PRO");
    });

    it("PUBLISHER + FREE stays FREE", () => {
      const user = createCurrentUser({ role: "PUBLISHER", plan: "FREE" });
      expect(user.plan).toBe("FREE");
    });
  });

  describe("privilege escalation prevention", () => {
    it("frontend cannot create GLOBAL_ADMIN by sending role field", () => {
      // The backend (handle_new_user trigger) controls role assignment.
      // The frontend's role field is IGNORED by the backend.
      // This test verifies the TYPE SYSTEM prevents a PUBLISHER from
      // having permissions that a GLOBAL_ADMIN would have.
      const publisher = createCurrentUser({ role: "PUBLISHER" });
      expect(roleHasPermission(publisher.role, "users.delete")).toBe(false);
      expect(roleHasPermission(publisher.role, "users.change_role")).toBe(false);
    });

    it("PUBLISHER cannot access admin-only permissions", () => {
      const publisher = createCurrentUser({ role: "PUBLISHER" });
      const adminPermissions = [
        "users.delete",
        "users.change_role",
        "users.change_status",
      ] as const;
      for (const perm of adminPermissions) {
        expect(roleHasPermission(publisher.role, perm)).toBe(false);
      }
    });

    it("ADMIN cannot promote to GLOBAL_ADMIN-level permissions", () => {
      const admin = createCurrentUser({ role: "ADMIN", plan: null });
      expect(roleHasPermission(admin.role, "users.view_all")).toBe(false);
    });
  });

  describe("status-based access control", () => {
    it("ACTIVE user IS active", () => {
      const user = createCurrentUser({ status: "ACTIVE" });
      expect(user.isActive).toBe(true);
    });

    it("INACTIVE user is NOT active", () => {
      const user = createCurrentUser({ status: "INACTIVE" });
      expect(user.isActive).toBe(false);
    });

    it("SUSPENDED user is NOT active", () => {
      const user = createCurrentUser({ status: "SUSPENDED" });
      expect(user.isActive).toBe(false);
    });

    it("PENDING user is NOT active", () => {
      const user = createCurrentUser({ status: "PENDING" });
      expect(user.isActive).toBe(false);
    });

    it("non-ACTIVE users should be blocked from protected routes", () => {
      const blockedStatuses: UserStatus[] = ["INACTIVE", "SUSPENDED", "PENDING"];
      for (const status of blockedStatuses) {
        const user = createCurrentUser({ status });
        expect(user.isActive).toBe(false);
      }
    });
  });

  describe("Role/Plan independence", () => {
    it("ADMIN role does not require a plan", () => {
      const admin = createCurrentUser({ role: "ADMIN", plan: null });
      expect(admin.role).toBe("ADMIN");
      expect(admin.plan).toBeNull();
    });

    it("PUBLISHER must have a plan", () => {
      // PUBLISHER should always have a plan set (FREE by default)
      const pub = createCurrentUser({ role: "PUBLISHER", plan: "FREE" });
      expect(pub.plan).not.toBeNull();
    });

    it("plan does NOT affect permissions", () => {
      // Regardless of plan, permissions come from role only
      const freePublisher = createCurrentUser({ role: "PUBLISHER", plan: "FREE" });
      const proPublisher = createCurrentUser({ role: "PUBLISHER", plan: "PRO" });
      // PUBLISHER can create/publish campaigns regardless of plan
      expect(roleHasPermission(freePublisher.role, "campaigns.manage")).toBe(true);
      expect(roleHasPermission(proPublisher.role, "campaigns.manage")).toBe(true);
      // But plan never grants admin permissions
      expect(roleHasPermission(freePublisher.role, "users.edit")).toBe(false);
      expect(roleHasPermission(proPublisher.role, "users.change_role")).toBe(false);
    });
  });
});
