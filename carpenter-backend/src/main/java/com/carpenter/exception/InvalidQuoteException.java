package com.carpenter.exception;

public class InvalidQuoteException extends RuntimeException {
    public InvalidQuoteException(String message) {
        super(message);
    }
}
