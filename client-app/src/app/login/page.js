"use client";

import { useState } from 'react';

import { Button, TextInput, PasswordInput, Text } from '@mantine/core';
import { hasLength, isEmail, useForm } from '@mantine/form';

import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Page() {
  const form = useForm({
    mode: 'controlled',
    initialValues: { name: '', email: '', password: '' },
    validate: {
      name: hasLength({ min: 3 }, 'Must be at least 3 characters'),
      email: isEmail('Invalid email'),
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
    },
  });

  const [isRegister, setIsRegister] = useState(false);
  const [response, setResponse] = useState("")

  const handleSubmit = async (values) => {
    const body = values;

    axios.post(`${API_BASE_URL}/users/${isRegister ? 'register' : 'login'}`, body, {
      withCredentials: true, headers: {
        'Content-Type': 'application/json',
      }
    }).then(res => {
      setResponse("Success! Redirecting to home page...");
      window.localStorage.setItem('token', res.data.token);

      return window.location.href = '/';
    })
      .catch(err => {
        setResponse("Error: " + (err.response?.data?.message || "Something went wrong"));
      });

    setResponse("Error: " + (res.data?.message || "Something went wrong"));
  };

  return (
    <form style={{ width: '100dvw', height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onSubmit={form.onSubmit(handleSubmit)}>
      <Text
        size="xl"
        fw={900}
        variant="gradient"
        gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
        style={{ fontSize: '2rem', marginBottom: '1rem' }}
      >
        {isRegister ? 'Register' : 'Login'}
      </Text>

      <TextInput style={{ width: '40%' }} {...form.getInputProps('name')} label="Name" placeholder="Name" />
      <TextInput style={{ width: '40%' }} {...form.getInputProps('email')} mt="md" label="Email" placeholder="Email" />
      <PasswordInput style={{ width: '40%' }}  {...form.getInputProps('password')} type='password' mt="md" label="Password" placeholder="Password" />
      <Button type="submit" mt="md" style={{ width: '40%' }} color="blue" size="md">
        Submit
      </Button>

      <Text onClick={() => { setIsRegister(prev => !prev) }} style={{ marginTop: '1rem', color: 'blue', cursor: 'pointer' }}>
        {isRegister ? 'Already have an account? Login' : 'Don\'t have an account? Register'}
      </Text>

      <Text style={{ marginTop: '1rem', color: 'red' }}>{response}</Text>
    </form>
  );
}