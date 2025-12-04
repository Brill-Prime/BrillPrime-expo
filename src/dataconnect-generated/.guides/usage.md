# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useListMovies, useListUsers, useListUserReviews, useGetMovieById, useSearchMovie, useCreateMovie, useUpsertUser, useAddReview, useDeleteReview } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useListMovies();

const { data, isPending, isSuccess, isError, error } = useListUsers();

const { data, isPending, isSuccess, isError, error } = useListUserReviews();

const { data, isPending, isSuccess, isError, error } = useGetMovieById(getMovieByIdVars);

const { data, isPending, isSuccess, isError, error } = useSearchMovie(searchMovieVars);

const { data, isPending, isSuccess, isError, error } = useCreateMovie(createMovieVars);

const { data, isPending, isSuccess, isError, error } = useUpsertUser(upsertUserVars);

const { data, isPending, isSuccess, isError, error } = useAddReview(addReviewVars);

const { data, isPending, isSuccess, isError, error } = useDeleteReview(deleteReviewVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { listMovies, listUsers, listUserReviews, getMovieById, searchMovie, createMovie, upsertUser, addReview, deleteReview } from '@dataconnect/generated';


// Operation ListMovies: 
const { data } = await ListMovies(dataConnect);

// Operation ListUsers: 
const { data } = await ListUsers(dataConnect);

// Operation ListUserReviews: 
const { data } = await ListUserReviews(dataConnect);

// Operation GetMovieById:  For variables, look at type GetMovieByIdVars in ../index.d.ts
const { data } = await GetMovieById(dataConnect, getMovieByIdVars);

// Operation SearchMovie:  For variables, look at type SearchMovieVars in ../index.d.ts
const { data } = await SearchMovie(dataConnect, searchMovieVars);

// Operation CreateMovie:  For variables, look at type CreateMovieVars in ../index.d.ts
const { data } = await CreateMovie(dataConnect, createMovieVars);

// Operation UpsertUser:  For variables, look at type UpsertUserVars in ../index.d.ts
const { data } = await UpsertUser(dataConnect, upsertUserVars);

// Operation AddReview:  For variables, look at type AddReviewVars in ../index.d.ts
const { data } = await AddReview(dataConnect, addReviewVars);

// Operation DeleteReview:  For variables, look at type DeleteReviewVars in ../index.d.ts
const { data } = await DeleteReview(dataConnect, deleteReviewVars);


```