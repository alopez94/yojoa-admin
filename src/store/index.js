import { configureStore } from "@reduxjs/toolkit";
import establishmentsReducer from './establishmentSlice'

export const store = configureStore({
    reducer: {
        establishments: establishmentsReducer,
    }
})

export default store;