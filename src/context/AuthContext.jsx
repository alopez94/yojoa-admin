import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [establishmentData, setEstablishmentData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [accessError, setAccessError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {

            setAccessError(null);

            if (currentUser) {

                try {

                    const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
                    if (!userSnap.exists()) {
                        setAccessError('not_establishment');
                        setIsLoading(false);
                        return
                    }

                    const userData = userSnap.data();
                    setUser(currentUser);
                    setUserData(userData);

                    if(userData.role === 'admin'){
                        setIsLoading(false);
                        return;
                    }

                    if (userData.role !== 'establishment') {
                        setUser(currentUser);
                        setUserData(userData);
                        setAccessError('not_establishment');
                        setIsLoading(false);
                        return;
                    }

                    const estSnap = await getDoc(doc(db, 'establishments', currentUser.uid));
                    if (!estSnap.exists()) {
                        setUser(currentUser);
                        setUserData(userData);
                        setAccessError('pending_approval');
                        return;
                    }

                    const estData = { id: estSnap.id, ...estSnap.data() };


                    if (estData.status === 'pending_approval') {
                        setAccessError('pending_approval');
                    } else if (estData.status === 'rejected') {
                        setAccessError('rejected');
                    } else if (estData.status === 'deactivated') {
                        setAccessError('deactivated');
                    }

                    // Still set the data regardless — useful for showing info on blocked screens
                    setUser(currentUser);
                    setUserData(userData);
                    setEstablishmentData(estData);
                }
                catch (error) {
                    console.error('auth context error', error);
                }

            }
            else {
                setUser(null);
                setUserData(null);
                setEstablishmentData(null);
                setAccessError(null);
            }
                setIsLoading(false);
        })

        return unsubscribe;

    }, []);



    return (
        <AuthContext.Provider value={{ 
            user, 
            userData, 
            establishmentData, 
            isLoading,
            accessError,
            isAuthenticated: !!user,
            isAdmin: userData?.role === 'admin',
            isApproved: establishmentData?.status === 'approved' }}>
            {children}
        </AuthContext.Provider>
    );

};

export const useAuth = () => useContext(AuthContext);
