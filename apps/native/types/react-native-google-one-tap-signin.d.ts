declare module "react-native-google-one-tap-signin" {
  export type GoogleOneTapCredential = {
    idToken: string;
    id: string;
    email: string;
    displayName: string;
    givenName: string;
    familyName: string;
    photo: string;
  };

  export const GoogleOneTapSignIn: {
    signInWithGoogle(
      webClientId: string,
      nonce?: string | null,
    ): Promise<GoogleOneTapCredential>;
    signIn(): Promise<{ id: string; password: string }>;
    signOut(): Promise<boolean>;
    savePassword(username: string, password: string): Promise<boolean>;
    deletePassword(username: string, password: string): Promise<boolean>;
  };
}
