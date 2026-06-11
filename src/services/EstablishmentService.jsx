import { collection, getDocs, query } from "firebase/firestore"
import { db } from "../config/firebase"



export const getEstablishments = async () => {
    try{
        const q = query(
            collection(db,'establishments')
        );

        const snap = await getDocs(q);
        return snap.docs.map(d=> ({id: d.id, ...d.data()}));
    }
    catch(error){
        console.log('error fetching establishments', error)
    }
}