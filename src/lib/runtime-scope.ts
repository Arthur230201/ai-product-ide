import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Recharts from 'recharts';
import * as Lucide from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Runtime scope for code execution
 * Mimics the global environment in SRS.html
 */
export const scope = {
  React,
  useState,
  useEffect,
  useCallback,
  useRef,
  Recharts,
  Lucide,
  clsx,
  twMerge,
};
