import { configureStore } from "@reduxjs/toolkit";
import establishmentsReducer from './establishmentSlice'

export const store = configureStore({
    reducer: {
        establishments: establishmentsReducer,
    },
    middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
        serializableCheck: {
            ingorePaths: ['establishment.list'],
        }
    })
})

export default store;