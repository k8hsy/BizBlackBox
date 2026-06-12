import { updateAndDelete } from "@/lib/crudRoute";
const { PATCH, DELETE } = updateAndDelete("venue", { adminOnlyWrite: true });
export { PATCH, DELETE };
