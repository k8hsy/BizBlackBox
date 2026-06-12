import { updateAndDelete } from "@/lib/crudRoute";
const { PATCH, DELETE } = updateAndDelete("prelim", { adminOnlyWrite: true });
export { PATCH, DELETE };
