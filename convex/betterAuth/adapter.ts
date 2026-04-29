import { createApi } from "@convex-dev/better-auth";
import { createAuthOptions } from "./auth";
import schema from "./schema";
import type {
    FunctionArgs,
    FunctionReference,
    FunctionReturnType,
    FunctionType,
    FunctionVisibility,
    RegisteredAction,
    RegisteredMutation,
    RegisteredQuery,
} from "convex/server";

type RegisteredFunction<Func extends FunctionReference<FunctionType>> =
    Func extends FunctionReference<infer Type, infer Visibility>
        ? Type extends "query"
            ? RegisteredQuery<
                  Extract<Visibility, FunctionVisibility>,
                  FunctionArgs<Func>,
                  FunctionReturnType<Func>
              >
            : Type extends "mutation"
              ? RegisteredMutation<
                    Extract<Visibility, FunctionVisibility>,
                    FunctionArgs<Func>,
                    FunctionReturnType<Func>
                >
              : Type extends "action"
                ? RegisteredAction<
                      Extract<Visibility, FunctionVisibility>,
                      FunctionArgs<Func>,
                      FunctionReturnType<Func>
                  >
                : never
        : never;

type BetterAuthApi = ReturnType<typeof createApi<typeof schema>>;
type BetterAuthFunction<Name extends keyof BetterAuthApi> = RegisteredFunction<
    BetterAuthApi[Name] & FunctionReference<FunctionType>
>;

const _api: BetterAuthApi = createApi(schema, createAuthOptions);

export const create = _api.create;
export const findOne = _api.findOne;
export const findMany = _api.findMany;
export const updateOne: BetterAuthFunction<"updateOne"> = _api.updateOne;
export const updateMany: BetterAuthFunction<"updateMany"> = _api.updateMany;
export const deleteOne: BetterAuthFunction<"deleteOne"> = _api.deleteOne;
export const deleteMany: BetterAuthFunction<"deleteMany"> = _api.deleteMany;
