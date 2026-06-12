import { listAndCreate } from "@/lib/crudRoute";
const { GET, POST } = listAndCreate("prelim", { time: 1, room: 1 }, { adminOnlyWrite: true });
export { GET, POST };
