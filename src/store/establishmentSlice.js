import { createSlice, createAsyncThunk, isRejectedWithValue} from "@reduxjs/toolkit";
import { getEstablishments } from "../services/EstablishmentService";

export const fetchEstablishments = createAsyncThunk(
    'establishments/fetchAll',
    async (_, {isRejectedWithValue}) => {
        try {
            const data = getEstablishments();
            return data;
        }
        catch(error) {
            return isRejectedWithValue(error.message);
        }
    }
);

const establishmentSlice = createSlice({
    name: 'establishment',
    initialState: {
        list: [],
        filteredList: [],
        selectedCategory: null,
        searchQuery: '',
        status: 'idle',
        error: null,
        lastFetch: null,
    },
    reducers: {
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
            state.filteredList = applyFilters(
                state.list,
                state.searchQuery,
                action.payload
            );
        },
        setSelectedCategory: (state, action) => {
            state.selectedCategory = action.payload;
            state.filteredList = applyFilters(
                state.list,
                state.searchQuery,
                action.payload
            )
        },
        cleanFilters: (state) => {
            state.searchQuery = '';
            state.selectedCategory = null;
            state.filteredList = state.list;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEstablishments.pending, (state) => {
                state.status = 'loading',
                    state.error = 'null';
            })
            .addCase(fetchEstablishments.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.list = action.payload;
                state.filteredList = applyFilters(
                    action.payload,
                    state.searchQuery,
                    state.selectedCategory
                );
                state.lastFetch = Date.now();
            })
            .addCase(fetchEstablishments.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

    }
})

const applyFilters = (list, searchQuery, selectedCategory) => {
    let filtered = list;

    if(searchQuery?.trim()) {
        const lower = searchQuery.toLowerCase();
        filtered = filtered.filter(est =>
            est.name.toLowerCase().includes(lower) ||
            est.description?.toLowerCase().includes(lower)
        )
    }
    if(selectedCategory){
        filtered = filtered.filter(est =>
            est.category === selectedCategory
        );
    }
    return filtered;
}

export const {
    setSearchQuery,
    setSelectedCategory,
    cleanFilters
} = establishmentSlice.actions;

export const selectAllEstablishments = state => state.establishments.list;
export const selectFilteredEstablishments = state => state.establishments.filteredList;
export const selectEstablishmentStatus = state => state.establishments.status;
export const selectSearchQuery = state => state.establishments.searchQuery;
export const selectSelectedCategory = state => state.establishments.selectedCategory;
export const selectLastFetch = state => state.establishments.lastFetch;

export default establishmentSlice.reducer;   