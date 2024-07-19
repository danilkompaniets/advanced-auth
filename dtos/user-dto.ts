import { throws } from "assert";

class UserDto {
  email;
  id;
  isActivated;

  constructor(model: { email: string; id: number; isActivated: boolean }) {
    this.email = model.email;
    this.id = model.id;
    this.isActivated = model.isActivated;
  }
}

export default UserDto;
