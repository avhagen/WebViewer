/*******************************************************************************
#      ____               __          __  _      _____ _       _               #
#     / __ \              \ \        / / | |    / ____| |     | |              #
#    | |  | |_ __   ___ _ __ \  /\  / /__| |__ | |  __| | ___ | |__   ___      #
#    | |  | | '_ \ / _ \ '_ \ \/  \/ / _ \ '_ \| | |_ | |/ _ \| '_ \ / _ \     #
#    | |__| | |_) |  __/ | | \  /\  /  __/ |_) | |__| | | (_) | |_) |  __/     #
#     \____/| .__/ \___|_| |_|\/  \/ \___|_.__/ \_____|_|\___/|_.__/ \___|     #
#           | |                                                                #
#           |_|                 _____ _____  _  __                             #
#                              / ____|  __ \| |/ /                             #
#                             | (___ | |  | | ' /                              #
#                              \___ \| |  | |  <                               #
#                              ____) | |__| | . \                              #
#                             |_____/|_____/|_|\_\                             #
#                                                                              #
#                              (c) 2010-2011 by                                #
#           University of Applied Sciences Northwestern Switzerland            #
#                     Institute of Geomatics Engineering                       #
#                           martin.christen@fhnw.ch                            #
********************************************************************************
*     Licensed under MIT License. Read the file LICENSE for more information   *
*******************************************************************************/

//------------------------------------------------------------------------------
/**
 * @constructor
 * @description Terrainblock
 * @author Martin Christen, martin.christen@fhnw.ch
 */
function TerrainBlock(engine, quadcode, quadtree)
{
   this.engine = engine;
   this.quadcode = quadcode;
   this.quadtree = quadtree;
   this.texture = null;
   this.available = false;
   this.mesh = new Mesh(this.engine);
   
   this.vOffset = null; // virtual camera offset
   this.vTilePoints = new Array(5); // corner points and mid point of tile (in cartesian coordinates)
}
//------------------------------------------------------------------------------
/**
 * @description Request Data
 * @intern
 */
TerrainBlock.prototype._AsyncRequestData = function(imagelayerlist)
{
   var caller = this;
   if (imagelayerlist.length>0)
   {
      imagelayerlist[0].RequestTile(this.engine, this.quadcode, _cbfOnImageTileReady, _cbfOnImageTileFailed, caller);
   }
}
//------------------------------------------------------------------------------
/**
 * @description Callback when data is ready
 * @intern
 */
function _cbfOnImageTileReady(quadcode, ImageObject)
{
   var terrainblock = ImageObject.caller;
   terrainblock.texture = ImageObject;
   terrainblock._CreateElevationMesh();
   terrainblock.available = true;
}
//------------------------------------------------------------------------------       
/**
 * @description Callback when data failed
 * @intern
 */
function _cbfOnImageTileFailed(quadcode)
{
   // need to think how to handle this case...
}
//------------------------------------------------------------------------------
/**
 * @description Destroy Terrainblock and free all memory, especially GPU mem.
 */
TerrainBlock.prototype.Destroy = function()
{
   if (this.texture)
   {
      this.texture.Destroy();
   }
}

//------------------------------------------------------------------------------
/**
 * @description returns true if terrain block is available (can be rendered).
 * TerrainBlock is an asynchronous object and some data may not be available yet.
 */
TerrainBlock.prototype.IsAvailable = function()
{
   return this.available;
}
//------------------------------------------------------------------------------
/**
* @description Calculate visible pixel size
*/
TerrainBlock.prototype.GetPixelSize = function(mModelViewProjection, nWidth, nHeight)
{
   
}
//------------------------------------------------------------------------------
/**
* @description Calculate size of a block (cell size)
*/
TerrainBlock.prototype.GetBlockSize = function()
{
   
}
//------------------------------------------------------------------------------
/**
* @description Calc exact distance to another point
* @param {vec3} vWhere The position to measure to
* @param {vec3} outHitpoint shortest position to terrain
*/
TerrainBlock.prototype.CalcDistanceTo = function(vWhere, outHitpoint)
{
   
}

//------------------------------------------------------------------------------
/**
* @description Create Elevation Mesh
* @ignore
*/
TerrainBlock.prototype._CreateElevationMesh = function()
{
   var blocksize = 9;
   var elevationdata = new Array(blocksize*blocksize);
   for (var i=0;i<blocksize*blocksize;i++) 
   {
      elevationdata[i] = 0; // set elevation value to 0
   }
   
   //------------------------------------
   // this code needs major optimization
   // #fixme
   //------------------------------------
 
   //--------------------------
   // (1) CREATE TEXTURE COORDS
   //--------------------------
   
   var texcoordbuffer = new Array(2*blocksize*blocksize);
   
   var fdX = 1.0 / (blocksize-1);

   for (var nV = 0; nV<blocksize; nV++)
   {
      for (var nU = 0; nU<blocksize; nU++)
      {
         texcoordbuffer[2*(nV*blocksize+nU)+0] =  nU*fdX;
         texcoordbuffer[2*(nV*blocksize+nU)+1] =  /*1.0f-*/nV*fdX;
      }
   }  
   
   //----------------------
   // (2) CREATE POSITIONS
   //----------------------
   
   var positionbuffer = new Array(3*blocksize*blocksize);
   
   var x0,y0,x1,y1;
   var coords = new Array(4);
   var xy_coord = new Array(2);
   var xyz_cart = new Array(3);
   this.quadtree.QuadKeyToMercatorCoord(this.quadcode, coords);
   x0 = coords[0]; y0 = coords[1]; x1 = coords[2]; y1 = coords[3];

   var dH = (y1-y0)/(blocksize-1);
   var dW = (x1-x0)/(blocksize-1);
   var x_coord, y_coord;
   var x_cart, y_cart, z_cart;
   g = new GeoCoord();

   for (var y=0;y<blocksize;y++)
   {
      for (var x=0;x<blocksize;x++)
      {
         x_coord = x0 + x*dW;
         y_coord = y0 + y*dH;

         // Calculate 3D Position:

         Mercator.MercatorToWGS84(x_coord, y_coord, xy_coord);
         g.Set(xy_coord[0], xy_coord[1], elevationdata[y*blocksize+x]);
         g.ToCartesian(xyz_cart);
         x_cart = xyz_cart[0];
         y_cart = xyz_cart[1];
         z_cart = xyz_cart[2];
         
         if (x==0 && y==0)
         {
            this.vOffset = [x_cart, y_cart, z_cart];
         }

         if (x==0 && y==0)
         {
            this.vTilePoints[0] = [x_cart, y_cart, z_cart]; 
         }
         else if (x==blocksize-1 && y==0)
         {
            this.vTilePoints[1] = [x_cart, y_cart, z_cart]; 
         }
         else if (x==blocksize-1 && y==blocksize-1)
         {
            this.vTilePoints[2] = [x_cart, y_cart, z_cart]; 
         }
         else if (x==0 && y==blocksize-1)
         {
            this.vTilePoints[3] = [x_cart, y_cart, z_cart]; 
         }
         else if (x==(blocksize-1)/2 && y==(blocksize-1)/2)
         {
            this.vTilePoints[4] = [x_cart, y_cart, z_cart]; 
         }

         positionbuffer[3*y*blocksize+3*x+0] = x_cart - this.vOffset[0];
         positionbuffer[3*y*blocksize+3*x+1] = y_cart - this.vOffset[1];
         positionbuffer[3*y*blocksize+3*x+2] = z_cart - this.vOffset[2];
      }

   }
   
   // create interleaved buffer:
   var interleavedbuffer = new Array(5*blocksize*blocksize);
   
   for (var i=0;i<blocksize*blocksize;i++)
   {
      interleavedbuffer[5*i+0] = positionbuffer[3*i+0];
      interleavedbuffer[5*i+1] = positionbuffer[3*i+1];
      interleavedbuffer[5*i+2] = positionbuffer[3*i+2];    
      interleavedbuffer[5*i+3] = texcoordbuffer[2*i+0];
      interleavedbuffer[5*i+4] = texcoordbuffer[2*i+1];
   }
   
   // Create index buffer
   //var indexbuffer = new Array([0,1,3,0,3,2]);
   
  
   var indexbuffer = new Array();

   var v3;
   var cnt = 0;
   var xcnt = 0;
   var xx1, xx2, yy1, yy2;
   for (var x=0;x<=blocksize-2;x+=1)
   {
      for (var y=0;y<=blocksize-1;y+=1)
      {
         xx1 = x; 
         xx2 = x+1;

         if (xcnt%2 == 0) 
         {
            yy1 = blocksize-1-y;
            yy2 = yy1; 
         }
         else 
         {
            yy1 = y;
            yy2 = y;
         }

         //--------------------------------------------------------------------
         v3 = xx2+yy2*blocksize;
         
         indexbuffer[cnt++] =  xx1+yy1*blocksize; 
         indexbuffer[cnt++] = v3; 
      }
      indexbuffer[cnt++] = v3; 
      xcnt += 1;
   }
   
   // Fill Mesh
   this.mesh.SetBufferPT(interleavedbuffer);
   this.mesh.SetIndexBuffer(indexbuffer, "TRIANGLESTRIP");
   this.mesh.SetTexture(this.texture);
}

//------------------------------------------------------------------------------
/**
 * @description Render a terrain block. Requires model and view matrix for
 * some voodoo with floating point precision.
 */
TerrainBlock.prototype.Render = function(/*cache*/)
{
   var model = new mat4();
   model.CopyFrom(this.engine.matModel);
   
   // virtual camera offset: 
   model._values[12] += this.vOffset[0];
   model._values[13] += this.vOffset[1];
   model._values[14] += this.vOffset[2];
   
   this.engine.PushMatrices();
   this.engine.SetModelMatrix(model);
   
   this.mesh.Draw();
   
   this.engine.PopMatrices();
   
}

//------------------------------------------------------------------------------

