import React, { useCallback, useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Href, Link, useRouter } from 'expo-router';
import { useAuth, useSignIn, useSSO } from '@clerk/expo';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ActionButton, BodyText, uiStyles } from '@/components/studynut-ui';
import { AuthFrame, FieldLabel } from '@/components/auth-ui';
import { useColors } from '@/hooks/useColors';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const goHome = useCallback(async () => {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          setMessage('One more account step is required before you can continue.');
          return;
        }
        const url = decorateUrl('/');
        if (url.startsWith('http') && Platform.OS === 'web') {
          window.location.href = url;
        } else {
          router.replace(url as Href);
        }
      },
    });
  }, [router, signIn]);

  const handleSubmit = async () => {
    setMessage('');
    const result = await signIn.password({ emailAddress, password });
    if (result.error) {
      setMessage(result.error.message || 'We could not sign you in. Check your details and try again.');
      return;
    }
    if (signIn.status === 'complete') {
      await goHome();
    } else if (signIn.status === 'needs_client_trust') {
      const emailFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (emailFactor) {
        await signIn.mfa.sendEmailCode();
        setMessage('We sent a verification code to your email.');
      }
    }
  };

  const handleVerify = async () => {
    setMessage('');
    const result = await signIn.mfa.verifyEmailCode({ code });
    if (result.error) {
      setMessage(result.error.message || 'That code was not accepted.');
      return;
    }
    if (signIn.status === 'complete') await goHome();
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    setMessage('');
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId) {
        await setActive?.({
          session: createdSessionId,
          navigate: ({ decorateUrl }) => router.replace(decorateUrl('/') as Href),
        });
      } else {
        setMessage('Google sign-in needs one more step. Please complete it and try again.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google sign-in was cancelled or unavailable.');
    } finally {
      setOauthLoading(false);
    }
  };

  if (isSignedIn) {
    router.replace('/');
    return null;
  }

  const errorFor = (key: string) =>
    errors.fields[key as keyof typeof errors.fields]?.message;

  if (signIn.status === 'needs_client_trust') {
    return (
      <AuthFrame
        title="Verify your sign-in"
        subtitle="Enter the code we sent to your email to finish signing in."
        footer={<Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 }}>Need a different account?</Text>}
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
        <ActionButton title="Verify and continue" loading={fetchStatus === 'fetching'} disabled={!code} onPress={handleVerify} />
        <ActionButton title="Send a new code" variant="secondary" onPress={() => signIn.mfa.sendEmailCode()} />
        <ActionButton title="Start over" variant="quiet" onPress={() => { signIn.reset(); setMessage(''); }} />
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Sign in to keep your progress separate on this device."
      footer={
        <>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 }}>New to STUDYNUT?</Text>
          <Link href="/sign-up">
            <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12 }}>Create an account</Text>
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
        {errorFor('identifier') ? <BodyText style={{ color: colors.destructive, fontSize: 12 }}>{errorFor('identifier')}</BodyText> : null}
      </View>
      <View style={{ gap: 8 }}>
        <FieldLabel>Password</FieldLabel>
        <TextInput
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 13, color: colors.foreground, fontFamily: 'Inter_400Regular' }}
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
        />
        {errorFor('password') ? <BodyText style={{ color: colors.destructive, fontSize: 12 }}>{errorFor('password')}</BodyText> : null}
      </View>
      {message ? <BodyText style={{ color: colors.destructive, fontSize: 12 }}>{message}</BodyText> : null}
      <ActionButton
        title="Sign in with email"
        loading={fetchStatus === 'fetching'}
        disabled={!emailAddress || !password}
        onPress={handleSubmit}
      />
      <View style={[uiStyles.row, { alignItems: 'center', gap: 10 }]}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 11 }}>OR</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
      <ActionButton title={oauthLoading ? 'Opening Google…' : 'Continue with Google'} icon="globe" variant="secondary" loading={oauthLoading} onPress={handleGoogle} />
    </AuthFrame>
  );
}