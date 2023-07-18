import { type Component } from "solid-js";
import type { UserExtended } from "@/components/users/User.type";

const UserProfile: Component<{ user: UserExtended }> = (props) => {
  return <div>{JSON.stringify(props.user)}</div>;
};

export default UserProfile;
