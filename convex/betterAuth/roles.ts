import { createAccessControl, type Role } from "better-auth/plugins/access";

const statement = {
    member: ["invite", "add", "remove"],
} as const;

export const ac = createAccessControl(statement);

const OWNER = ac.newRole({
    member: ["invite", "add", "remove"],
});

const MEMBER = ac.newRole({
    member: ["invite", "add"],
});

export const ROLES = {
    OWNER: "owner",
    MEMBER: "member",
} as const;

export const ROLE_MAP = {
    [ROLES.OWNER]: OWNER,
    [ROLES.MEMBER]: MEMBER,
} as Record<string, Role>;

export const ROLE_VALUES = Object.values(ROLES);

export type RoleKey = keyof typeof ROLES;
export type RoleValue = (typeof ROLES)[RoleKey];
