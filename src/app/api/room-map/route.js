import { listAndCreate } from "@/lib/crudRoute";
const { GET, POST } = listAndCreate("room_map", { person: 1 }, { adminOnlyWrite: true });
export { GET, POST };
