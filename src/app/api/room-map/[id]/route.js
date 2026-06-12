import { updateAndDelete } from "@/lib/crudRoute";
const { PATCH, DELETE } = updateAndDelete("room_map", { adminOnlyWrite: true });
export { PATCH, DELETE };
