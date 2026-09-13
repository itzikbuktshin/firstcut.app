export const config = {
  framework: 'nextjs',
  functions: {
    'app/api/haircut/route.js': {
      maxDuration: 180,
    },
  },
};
