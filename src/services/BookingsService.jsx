import { where, collection, getDoc, doc, query, getDocs } from "firebase/firestore"
import { auth, db } from '../config/firebase';
import { useAuth } from "../context/AuthContext";
import { useState } from "react";


export const getEstablishmentBookings = async (establishmentId) => {
       
        try{
            const q = query(
                collection(db,'bookings'),
                where('establishmentId',"==",establishmentId),                
            );
            const snap = await getDocs(q);
            return snap.docs.map(d=> ({id: d.id, ...d.data()}));
        }
        catch(error) {
            console.log("Error Loading Bookings: ",error)
        }     

}

   
