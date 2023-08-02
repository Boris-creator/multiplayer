import {
  type Component,
  onMount,
  createSignal,
  createResource,
  For,
  Show,
} from "solid-js";
import { HttpService } from "@/services/httpService";
import type { Nullable } from "@/types";
import type { User, UserExtended } from "@/components/users/User.type";
import UserProfile from "@/components/users/UserProfile";

const UsersList: Component = () => {
  const [users, setUsers] = createSignal<Array<User>>([]);
  const [currentUser, setCurrentUser] = createSignal<Nullable<User>>(null);
  const [userExtended] = createResource(
    currentUser,
    async (user: User) =>
      (await HttpService.get<UserExtended>(`users/${user.id}`)).data
  );
  onMount(async () => {
    const { data } = await HttpService.get<Array<User>>("users");
    setUsers(data);
  });
  return (
    <div>
      <Show when={userExtended()}>
        <div class="fixed left-0 right-0 top-0 bg-white">
          <UserProfile user={userExtended() as UserExtended} />
        </div>
      </Show>
      <For each={users()}>
        {user => (
          <div
            class="text-left p-4 my-2 border border-[silver] cursor-pointer"
            onClick={() => {
              setCurrentUser(user);
            }}
          >
            {user.username}
          </div>
        )}
      </For>
    </div>
  );
};
export default UsersList;
