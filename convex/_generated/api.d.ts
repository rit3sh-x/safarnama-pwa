/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_debtSimplification from "../lib/debtSimplification.js";
import type * as lib_geo from "../lib/geo.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as lib_members from "../lib/members.js";
import type * as lib_notify from "../lib/notify.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_types from "../lib/types.js";
import type * as lib_utils from "../lib/utils.js";
import type * as methods_blogs from "../methods/blogs.js";
import type * as methods_comments from "../methods/comments.js";
import type * as methods_days from "../methods/days.js";
import type * as methods_expense_compute from "../methods/expense/compute.js";
import type * as methods_expense_migrate from "../methods/expense/migrate.js";
import type * as methods_expense_mutations from "../methods/expense/mutations.js";
import type * as methods_expense_queries from "../methods/expense/queries.js";
import type * as methods_file from "../methods/file.js";
import type * as methods_members from "../methods/members.js";
import type * as methods_messages from "../methods/messages.js";
import type * as methods_nodes from "../methods/nodes.js";
import type * as methods_notifications from "../methods/notifications.js";
import type * as methods_places from "../methods/places.js";
import type * as methods_ratings from "../methods/ratings.js";
import type * as methods_requests from "../methods/requests.js";
import type * as methods_trips from "../methods/trips.js";
import type * as methods_users from "../methods/users.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as seed from "../seed.js";
import type * as types from "../types.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  http: typeof http;
  "lib/constants": typeof lib_constants;
  "lib/debtSimplification": typeof lib_debtSimplification;
  "lib/geo": typeof lib_geo;
  "lib/helpers": typeof lib_helpers;
  "lib/members": typeof lib_members;
  "lib/notify": typeof lib_notify;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/types": typeof lib_types;
  "lib/utils": typeof lib_utils;
  "methods/blogs": typeof methods_blogs;
  "methods/comments": typeof methods_comments;
  "methods/days": typeof methods_days;
  "methods/expense/compute": typeof methods_expense_compute;
  "methods/expense/migrate": typeof methods_expense_migrate;
  "methods/expense/mutations": typeof methods_expense_mutations;
  "methods/expense/queries": typeof methods_expense_queries;
  "methods/file": typeof methods_file;
  "methods/members": typeof methods_members;
  "methods/messages": typeof methods_messages;
  "methods/nodes": typeof methods_nodes;
  "methods/notifications": typeof methods_notifications;
  "methods/places": typeof methods_places;
  "methods/ratings": typeof methods_ratings;
  "methods/requests": typeof methods_requests;
  "methods/trips": typeof methods_trips;
  "methods/users": typeof methods_users;
  rateLimiter: typeof rateLimiter;
  seed: typeof seed;
  types: typeof types;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
