import React, { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { useAuth, useSignUp } from '@clerk/expo';
import { Platform, Text, TextInput, View } from 'react-native';
import { ActionButton, BodyText } from '@/components/studynut-ui';
import { AuthFrame, FieldLabel } from '@/components/auth-ui';
import { useColors } from '@/hooks/useColors';

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const finishSignUp = async () => {
    await signUp.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          setMessage('One more account step is required before you can continue.');
          return;
        }
        const url = decorateUrl('/');
        if (url.startsWith('http') && Platform.OS === 'web') {
          window.location.href = url;
        } else {
          router.replace(url as never);
        }
      },
    });
  };

  const handleSubmit = async () => {
    setMessage('');
    const result = await signUp.password({ emailAddress, password });
    if (result.error) {
      setMessage(result.error.message || 'We could not create your account. Check your details and try again.');
      return;
    }
    await signUp.verifications.sendEmailCode();
    setMessage('We sent a verification code to your email.');
  };

  const handleVerify = async () => {
    setMessage('');
    const result = await signUp.verifications.verifyEmailCode({ code });
    if (result.error) {
      setMessage(result.error.message || 'That code was not accepted.');
      return;
    }
    if (signUp.status === 'complete') await finishSignUp();
  };

  if (isSignedIn) {
    router.replace('/');
    return null;
  }

  const errorFor = (key: string) =>
    errors.fields[key as keyof typeof errors.fields]?.message;

  if (
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0
  ) {
    return (
      <AuthFrame
        title="Verify your email"
        subtitle="Enter the code we sent to confirm your new STUDYNUT account."
        footer={<Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 }}>Almost there.</Text>}
      >
        <View style={{ gap: 8 }}>
          <FieldLabel>Verification code</FieldLabel>
          <TextInput
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 13, color: colors.foreground, fontFamily: 'Inter_400Regular' }}
            value={code}
            onChangeText={setCode}
            placeholder="Enter your code"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
          />
          {errorFor('code') ? <BodyText style={{ color: colors.destructive, fontSize: 12 }}>{errorFor('code')}</BodyText> : null}
        </View>
        {message ? <BodyText style={{ color: colors.destructive, fontSize: 12 }}>{message}</BodyText> : null}
        <ActionButton title="Verify and create account" loading={fetchStatus === 'fetching'} disabled={!code} onPress={handleVerify} />
        <ActionButton title="Send a new code" variant="secondary" onPress={() => signUp.verifications.sendEmailCode()} />
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Create your account"
      subtitle="Save your own study progress while keeping guest access available."
      footer={
        <>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 }}>Already have an account?</Text>
          <Link href="/sign-in">
            <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12 }}>Sign in</Text>
          </Link>
        </>
      }
    >
      <View style={{ gap: 8 }}>
        <FieldLabel>Email address</FieldLabel>
        <TextInput
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 13, color: colors.foreground, fontFamily: 'Inter_400Regular' }}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={emailAddress}
          onChangeText={setEmailAddress}
          placeholder="you@example.com"
          placeholderTextColor={colors.mutedForeground}
        />
        {errorFor('emailAddress') ? <BodyText style={{ color: colors.destructive, fontSize: 12 }}>{errorFor('emailAddress')}</BodyText> : null}
      </View>
      <View style={{ gap: 8 }}>
        <FieldLabel>Password</FieldLabel>
        <TextInput
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 13, color: colors.foreground, fontFamily: 'Inter_400Regular' }}
          value={password}
          onChangeText={setPassword}
          placeholder="Choose a password"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
        />
        {errorFor('password') ? <BodyText style={{ color: colors.destructive, fontSize: 12 }}>{errorFor('password')}</BodyText> : null}
      </View>
      {message ? <BodyText style={{ color: colors.destructive, fontSize: 12 }}>{message}</BodyText> : null}
      <ActionButton title="Create account" loading={fetchStatus === 'fetching'} disabled={!emailAddress || !password} onPress={handleSubmit} />
      <View nativeID="clerk-captcha" />
    </AuthFrame>
  );
}