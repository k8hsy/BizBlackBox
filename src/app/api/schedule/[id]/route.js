import { updateAndDelete } from "@/lib/crudRoute";
const { PATCH, DELETE } = updateAndDelete("schedule", { adminOnlyWrite: true });
export { PATCH, DELETE };
