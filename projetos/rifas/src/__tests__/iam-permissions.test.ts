import { describe, expect, it } from "vitest";

import { ROLE_PERMISSIONS, roleHasAnyPermission, roleHasPermission } from "@/lib/permissions";
import type { RoleCode } from "@/types/profile";

describe("IAM — Permissions", () => {
  describe("ROLE_PERMISSIONS structure", () => {
    it("has exactly three roles defined", () => {
      const roles = Object.keys(ROLE_PERMISSIONS) as RoleCode[];
      expect(roles).toHaveLength(3);
      expect(roles).toContain("GLOBAL_ADMIN");
      expect(roles).toContain("ADMIN");
      expect(roles).toContain("PUBLISHER");
    });

    it("GLOBAL_ADMIN has all permissions", () => {
      const admin = ROLE_PERMISSIONS.GLOBAL_ADMIN;
      expect(admin).toContain("users.delete");
      expect(admin).toContain("users.edit");
      expect(admin).toContain("users.change_role");
      expect(admin).toContain("settings.edit");
      expect(admin).toContain("reports.view");
      expect(admin).toContain("audit.view_all");
    });

    it("ADMIN has operational permissions including user management", () => {
      const admin = ROLE_PERMISSIONS.ADMIN;
      expect(admin).toContain("users.create");
      expect(admin).toContain("users.edit");
      expect(admin).toContain("users.delete");
      expect(admin).toContain("users.change_role");
      expect(admin).toContain("campaigns.manage");
      expect(admin).toContain("campaigns.publish");
      expect(admin).toContain("settings.edit");
    });

    it("PUBLISHER has creator permissions (campaigns) but no admin/user mgmt", () => {
      const pub = ROLE_PERMISSIONS.PUBLISHER;
      expect(pub).toContain("dashboard.view");
      expect(pub).toContain("campaigns.view");
      expect(pub).toContain("campaigns.manage");
      expect(pub).toContain("campaigns.publish");
      expect(pub).toContain("files.upload");
      expect(pub).not.toContain("users.edit");
      expect(pub).not.toContain("settings.edit");
      expect(pub).not.toContain("users.change_role");
    });
  });

  describe("roleHasPermission", () => {
    it("returns true for assigned permissions", () => {
      expect(roleHasPermission("GLOBAL_ADMIN", "users.delete")).toBe(true);
      expect(roleHasPermission("ADMIN", "campaigns.manage")).toBe(true);
      expect(roleHasPermission("PUBLISHER", "files.upload")).toBe(true);
    });

    it("returns false for unassigned permissions", () => {
      expect(roleHasPermission("PUBLISHER", "users.delete")).toBe(false);
      expect(roleHasPermission("ADMIN", "users.view_all")).toBe(false);
    });

    it("returns false for null role", () => {
      expect(roleHasPermission(null, "dashboard.view")).toBe(false);
    });
  });

  describe("roleHasAnyPermission", () => {
    it("returns true if at least one matches", () => {
      expect(roleHasAnyPermission("PUBLISHER", ["dashboard.view", "users.delete"])).toBe(true);
    });

    it("returns false if none match", () => {
      expect(roleHasAnyPermission("PUBLISHER", ["users.delete", "settings.edit"])).toBe(false);
    });
  });

  describe("Plan/Role separation", () => {
    it("PRO plan does not grant admin permissions", () => {
      // Plan codes are independent from role — plan never affects permissions
      expect(roleHasPermission("PUBLISHER", "users.edit")).toBe(false);
      expect(roleHasPermission("PUBLISHER", "users.change_role")).toBe(false);
      // PUBLISHER can create/publish campaigns, but cannot manage users
      expect(roleHasPermission("PUBLISHER", "campaigns.manage")).toBe(true);
      expect(roleHasPermission("PUBLISHER", "campaigns.publish")).toBe(true);
    });

    it("GLOBAL_ADMIN has plan=null, still has full permissions", () => {
      expect(roleHasPermission("GLOBAL_ADMIN", "users.change_role")).toBe(true);
      expect(roleHasPermission("GLOBAL_ADMIN", "settings.edit")).toBe(true);
    });
  });
});
