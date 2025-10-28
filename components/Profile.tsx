import React, { useState, useEffect, useRef } from 'react';
import { User, Grade } from '../types';

interface ProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const FormInput: React.FC<{ label: string; id: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, id, type = 'text', value, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <div className="mt-1">
            <input
                type={type}
                name={id}
                id={id}
                value={value}
                onChange={onChange}
                className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white"
            />
        </div>
    </div>
);

const FormSelect: React.FC<{ label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }> = ({ label, id, value, onChange, children }) => (
     <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <div className="mt-1">
            <select
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                 className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white"
            >
                {children}
            </select>
        </div>
    </div>
);

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
    const [formData, setFormData] = useState(user);
    const [isDirty, setIsDirty] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFormData(user);
        setIsDirty(false);
    }, [user]);
    
    useEffect(() => {
        setIsDirty(JSON.stringify(formData) !== JSON.stringify(user));
    }, [formData, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateUser(formData);
        setIsDirty(false);
        // Add a visual confirmation if desired
    };

    const handleCancel = () => {
        setFormData(user);
        setIsDirty(false);
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Profil Utilisateur</h1>
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                        <div className="md:col-span-1 flex flex-col items-center justify-center space-y-4">
                           <div className="relative">
                                <img className="h-32 w-32 rounded-full ring-4 ring-brand-red/50 object-cover" src={formData.avatarUrl} alt="Avatar" />
                                <button type="button" onClick={handleAvatarClick} className="absolute bottom-0 right-0 bg-brand-red text-white rounded-full p-2 hover:bg-brand-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                </button>
                           </div>
                           <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{`${formData.prenom} ${formData.nom}`}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{formData.caserne}</p>
                           </div>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormInput label="Prénom" id="prenom" value={formData.prenom} onChange={handleChange} />
                                <FormInput label="Nom" id="nom" value={formData.nom} onChange={handleChange} />
                           </div>
                            <FormInput label="Email" id="email" type="email" value={formData.email} onChange={handleChange} />
                            <FormInput label="Téléphone" id="telephone" type="tel" value={formData.telephone || ''} onChange={handleChange} />
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <FormSelect label="Grade" id="grade" value={formData.grade} onChange={handleChange}>
                                    {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                               </FormSelect>
                               <FormInput label="Caserne" id="caserne" value={formData.caserne} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                       {isDirty && (
                         <button type="button" onClick={handleCancel} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red">
                            Annuler
                        </button>
                       )}
                        <button type="submit" disabled={!isDirty} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-red hover:bg-brand-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red disabled:bg-gray-400 disabled:cursor-not-allowed">
                            Enregistrer les modifications
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};