import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_tjP1zDTTZ',
      userPoolClientId: '1eeilt9h92v5m65gd2rfgtf9ff',
    },
  },
});
