declare namespace App.Data.Auth {
export type LoginData = {
email: string;
password: string;
remember: boolean;
ip: string | null;
};
export type SignupData = {
name: string;
email: string;
password: string;
password_confirmation: string;
};
export type UserData = {
name: string;
email: string;
};
}
