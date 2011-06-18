#ifndef SEGVHANDLER
#define SEGVHANDLER

#include "barrier.h"


/** Prepare the signal handler */
void segvhandler_attach();

/** Remove the signal handler */
void segvhandler_detatch();

/** Return 1 if the signal handler is attached */
int segvhandler_isattached();

#endif
