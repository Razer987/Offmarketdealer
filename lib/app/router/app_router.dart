import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/hypercars/presentation/screens/hypercar_list_screen.dart';
import '../../features/hypercars/presentation/screens/hypercar_detail_screen.dart';
import '../../features/hypercars/presentation/screens/hypercar_form_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      name: 'list',
      pageBuilder: (context, state) => const NoTransitionPage(
        child: HypercarListScreen(),
      ),
    ),
    GoRoute(
      path: '/car/:id',
      name: 'detail',
      pageBuilder: (context, state) {
        final id = int.parse(state.pathParameters['id']!);
        return _buildSlideUpPage(
          context,
          state,
          HypercarDetailScreen(carId: id),
        );
      },
    ),
    GoRoute(
      path: '/add',
      name: 'add',
      pageBuilder: (context, state) => _buildSlideUpPage(
        context,
        state,
        const HypercarFormScreen(),
      ),
    ),
    GoRoute(
      path: '/edit/:id',
      name: 'edit',
      pageBuilder: (context, state) {
        final id = int.parse(state.pathParameters['id']!);
        return _buildSlideUpPage(
          context,
          state,
          HypercarFormScreen(editId: id),
        );
      },
    ),
  ],
);

CustomTransitionPage<void> _buildSlideUpPage(
  BuildContext context,
  GoRouterState state,
  Widget child,
) {
  return CustomTransitionPage(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 280),
    reverseTransitionDuration: const Duration(milliseconds: 220),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0.0, 0.06),
          end: Offset.zero,
        ).animate(CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutCubic,
        )),
        child: FadeTransition(
          opacity: CurvedAnimation(
            parent: animation,
            curve: Curves.easeOut,
          ),
          child: child,
        ),
      );
    },
  );
}
