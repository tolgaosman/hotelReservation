<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when a request is well-formed but violates a domain rule
 * (e.g. an invalid reservation status transition) that isn't naturally
 * expressed as a Form Request validation rule.
 */
class DomainActionException extends RuntimeException
{
}
