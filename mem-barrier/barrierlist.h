#ifndef BARRIERLIST_H
#define BARRIERLIST_H
#include <stdlib.h>
#include <semaphore.h>

#include "barrier.h"
/**
 * This tracks installed memory barriers. Usage:
 * barrierlist_add and barrierlist_remove are called by barrier_init and barrier_destroy
 * barrierlist_match is called by a signal handler to find which barrier triggered the segfault
 *
 * All functions are reentrant but only barrierlist_match is async-signal-safe
 */

#ifndef barrierlist_malloc
/** The allocator to use for internal data structures. Can be overridden */
#define barrierlist_malloc(sz) malloc(sz)
#endif

#ifndef barrierlist_free
/** The deallocator to use for internal data structures. Can be overridden */
#define barrierlist_free(addr) free(addr)
#endif

/**
 * Initialize the barrierlist
 */
void barrierlist_init();

/**
 * Start tracking a memory barrier
 */
void barrierlist_add(struct barrier* barrier);

/**
 * Stop tracking a memory barrier
 */
void barrierlist_remove(struct barrier* barrier);

/*
 * Find which memory barrier (if any) covers address addr
 * Reentrant and async-signal-safe
 */
struct barrier* barrierlist_match(char* addr);

#endif
