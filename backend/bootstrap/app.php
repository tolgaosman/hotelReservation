<?php

use App\Exceptions\DomainActionException;
use App\Http\Traits\ApiResponder;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
        // This is an API-only app with no 'login' route to redirect guests to;
        // returning null keeps unauthenticated requests a clean 401 instead of
        // crashing on route('login') when a client omits Accept: application/json.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $responder = new class
        {
            use ApiResponder;
        };

        $exceptions->render(function (ValidationException $e, Request $request) use ($responder) {
            if ($request->is('api/*')) {
                return $responder->error($e->getMessage(), $e->errors(), 422);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) use ($responder) {
            if ($request->is('api/*')) {
                return $responder->error('Unauthenticated.', null, 401);
            }
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) use ($responder) {
            if ($request->is('api/*')) {
                return $responder->error($e->getMessage() ?: 'This action is unauthorized.', null, 403);
            }
        });

        $exceptions->render(function (ModelNotFoundException $e, Request $request) use ($responder) {
            if ($request->is('api/*')) {
                return $responder->error('Resource not found.', null, 404);
            }
        });

        $exceptions->render(function (DomainActionException $e, Request $request) use ($responder) {
            if ($request->is('api/*')) {
                return $responder->error($e->getMessage(), null, 422);
            }
        });

        $exceptions->render(function (HttpExceptionInterface $e, Request $request) use ($responder) {
            if ($request->is('api/*')) {
                return $responder->error($e->getMessage() ?: 'Error.', null, $e->getStatusCode());
            }
        });
    })->create();
