import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/firebase';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.655-3.396-11.296-7.944l-6.572 5.025C9.506 39.554 16.227 44 24 44z"/>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.447-2.274 4.481-4.243 5.952l6.19 5.238C42.012 35.586 44 30.033 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
);

export const Login: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isSignUp) {
                await signUpWithEmail(email, password);
            } else {
                await signInWithEmail(email, password);
            }
            // onAuthStateChanged in App.tsx will handle the rest
        } catch (err: any) {
            switch (err.code) {
                case 'auth/invalid-email':
                    setError('Adresse email invalide.');
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('Email ou mot de passe incorrect.');
                    break;
                case 'auth/email-already-in-use':
                    setError('Cette adresse email est déjà utilisée.');
                    break;
                case 'auth/weak-password':
                    setError('Le mot de passe doit contenir au moins 6 caractères.');
                    break;
                default:
                    setError('Une erreur est survenue. Veuillez réessayer.');
                    break;
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-brand-dark px-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 sm:p-12 text-center">
                    <div className="flex justify-center mb-6">
                         <img src="/vacaraptor-logo.png" alt="VACARAPTOR Logo" className="h-24 w-auto" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">VACARAPTOR</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">{isSignUp ? "Créez votre compte" : "Connectez-vous pour continuer"}</p>
                    
                    <form onSubmit={handleEmailPasswordSubmit} className="space-y-4 text-left">
                        <div>
                            <label htmlFor="email" className="sr-only">Email</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white"
                                placeholder="Adresse e-mail"
                                required
                            />
                        </div>
                         <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white"
                                placeholder="Mot de passe"
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                         <button
                            type="submit"
                            className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm bg-brand-red text-white text-sm font-medium hover:bg-brand-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red transition"
                        >
                            {isSignUp ? "S'inscrire" : 'Se connecter'}
                        </button>
                    </form>

                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm">OU</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    </div>

                    <button
                        onClick={signInWithGoogle}
                        className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red transition"
                    >
                        <GoogleIcon />
                        {isSignUp ? "S'inscrire avec Google" : 'Connexion avec Google'}
                    </button>
                    
                     <p className="mt-8 text-sm text-center">
                        <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="font-medium text-brand-red hover:underline">
                            {isSignUp ? "Vous avez déjà un compte ? Connectez-vous" : "Pas encore de compte ? Inscrivez-vous"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};